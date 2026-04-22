import Java from 'frida-java-bridge'
import { configManager } from '../config/ConfigManager';
import { BossBattleOverlay } from '../overlay/BossBattleOverlay';
import { ModOverlay_HUD } from '../overlay/ModOverlay_HUD';

export class OverlayManager {
    private static instance: OverlayManager;
    private overlays: Record<string, any> = {};
    private context: any;

    pendingMessages: Record<string, string[]> = {};
    htmlReady: Record<string, boolean> = {};


    private constructor() {}

    static getInstance(): OverlayManager {
        if (!this.instance) this.instance = new OverlayManager();
        return this.instance;
    }

    initialize(context: any) {
        this.context = context;
    }

    createOverlay(name: string, url: string, touchPassthrough: boolean = true): Promise<void> {
        Logger(`[Overlay] createOverlay START for "${name}"`);

        const self = this;

        return new Promise((resolve, reject) => {
            Java.scheduleOnMainThread(() => {
                Logger(`[Overlay] ENTER main thread for "${name}"`);

                try {
                    // 1. Declare variables at the top so the bridge can see them via closure
                    let wm = null;
                    let lp = null;
                    let layout = null;


                    const WebView = Java.use("android.webkit.WebView");
                    const FrameLayout = Java.use("android.widget.FrameLayout");
                    const FrameLayoutParams = Java.use("android.widget.FrameLayout$LayoutParams");

                    Logger("[Overlay] Creating WebView instance");
                    const webview = WebView.$new(self.context);
                    Logger("[Overlay] WebView created");

                    const WebChromeClient = Java.use("android.webkit.WebChromeClient");
                    webview.setWebChromeClient(WebChromeClient.$new());

                    const WebViewClient = Java.use("android.webkit.WebViewClient");
                    webview.setWebViewClient(WebViewClient.$new());


                    // Required for JS engine initialization
                    const View = Java.use("android.view.View");
                    webview.setLayerType(View.LAYER_TYPE_HARDWARE.value, null);

                    // WebView: visual only, but JS still needs focusable state
                    webview.setClickable(false);
                    webview.setLongClickable(false);
                    webview.setFocusable(false);            // <-- REQUIRED
                    webview.setFocusableInTouchMode(false); // <-- REQUIRED
                    
                    // webview.setFocusable(true);            // <-- REQUIRED
                    // webview.setFocusableInTouchMode(true); // <-- REQUIRED
                    webview.setVerticalScrollBarEnabled(false);
                    webview.setHorizontalScrollBarEnabled(false);
                    webview.setOverScrollMode(2);
                    webview.setBackgroundColor(0x00000000);
                    webview.setAlpha(1.0);

                    const settings = webview.getSettings();
                    settings.setUseWideViewPort(true);
                    settings.setLoadWithOverviewMode(true);
                    settings.setSupportZoom(false);
                    settings.setBuiltInZoomControls(false);
                    settings.setDisplayZoomControls(false);
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);


                    Logger("[Overlay] Registering JSBridge");
                    const JSBridge = Java.registerClass({
                        name: "com.overlay.JSBridge_" + name,
                        methods: {
                            // Add this new method to the bridge
                            // Inside your JSBridge implementation
                            setTouchState: {
                                returnType: 'void',
                                argumentTypes: ['boolean'],
                                implementation: function (isTouchable) {
                                    if (!wm || !lp || !layout) return;
                                    
                                    Java.scheduleOnMainThread(() => {
                                        const FLAG_NOT_TOUCHABLE = 0x10; // Hex for 16
                                        
                                        if (isTouchable) {
                                            Logger("[*] setTouchState >> IS TOUCHABLE");
                                            lp.flags.value &= ~FLAG_NOT_TOUCHABLE; // Remove flag: intercepts touch
                                        } else {
                                            Logger("[*] setTouchState >> IS NOT TOUCHABLE");
                                            lp.flags.value |= FLAG_NOT_TOUCHABLE;  // Add flag: passes through
                                        }
                                        
                                        // Critical: Redraw the layout so the touch region updates
                                        wm.updateViewLayout(layout, lp);
                                    });
                                }
                            }
                            ,
                            sendToMod: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String'],
                                implementation: function (jsonString: string) {
                                    try {
                                        const data = JSON.parse(jsonString);

                                        if (data.type === "READY") {
                                            Logger(`[Overlay] ${data.overlay} is ready to receive data`);
                                            
                                            // 1. Mark as ready and flush any queued messages
                                            self.onHtmlReady(data.overlay);

                                            // 2. Send specific initial data based on which overlay just loaded
                                            if (data.overlay === ModOverlay_HUD.OVERLAY_NAME) {
                                                const js = `initStats(${configManager.get('currentTier')}, ${configManager.get('currentDeathTier')}, ${configManager.get('honorScore')}, ${configManager.get('aidScore')});`;
                                                self.sendToHtml(data.overlay, js);
                                            } 
                                            else if (data.overlay === BossBattleOverlay.OVERLAY_NAME) {
                                                // Send boss-specific init data here
                                            }
                                        } else {
                                            // Handle other messages (damage, clicks, etc)
                                            const overlay = self.overlays[data.overlay];
                                            if (overlay && overlay.onHtmlMessage) {
                                                overlay.onHtmlMessage(data.value);
                                            }
                                        }
                                    } catch (e) {
                                        Logger("[Overlay] Bridge Error: " + e);
                                    }
                                }

                            }
                        }
                    });
                    Logger("[Overlay] JSBridge registered");

                    // Fetch GitHub Raw HTML in background, then inject it
                    const Thread = Java.use("java.lang.Thread");
                    const URL = Java.use("java.net.URL");
                    const Scanner = Java.use("java.util.Scanner");
                    const Pattern = Java.use("java.util.regex.Pattern");

                    const RunnableImpl = Java.registerClass({
                        name: "com.overlay.RunnableFetch_" + name,
                        implements: [Java.use("java.lang.Runnable")],
                        methods: {
                            run: function () {
                                try {
                                    Logger("[Overlay] Fetching GitHub Raw HTML...");

                                    const u = URL.$new(url);
                                    const stream = u.openStream();
                                    const scanner = Scanner.$new(stream, "UTF-8");
                                    scanner.useDelimiter(Pattern.quote("\\A"));

                                    const html = scanner.hasNext() ? scanner.next() : "";
                                    scanner.close();

                                    Logger("[Overlay] HTML fetched, injecting...");

                                    Java.scheduleOnMainThread(() => {
                                        webview.loadDataWithBaseURL(
                                            "file:///android_asset/",   // trusted origin
                                            html,
                                            "text/html; charset=UTF-8", // <-- REQUIRED for JS execution
                                            "UTF-8",
                                            null
                                        );


                                        Logger("[Overlay] HTML injected as proper HTML");
                                    });

                                } catch (e) {
                                    Logger("[Overlay] Background fetch error: " + e);
                                }
                            }
                        }
                    });

                    Thread.$new(RunnableImpl.$new()).start();

                    layout = FrameLayout.$new(self.context);
                    const flParams = FrameLayoutParams.$new(-1, -1);
                    layout.addView(webview, flParams);

                    // WindowManager fullscreen, NOT_TOUCHABLE overlay
                    try {
                        const UnityPlayer = Java.use("com.unity3d.player.UnityPlayer");
                        const activity = UnityPlayer.currentActivity.value;


                        const WindowManager = Java.use("android.view.WindowManager");
                        const WMLayoutParams = Java.use("android.view.WindowManager$LayoutParams");
                        const PixelFormat = Java.use("android.graphics.PixelFormat");
                        const Gravity = Java.use("android.view.Gravity");

                        const wm = Java.cast(
                            activity.getSystemService("window"),
                            WindowManager
                        );
                        // ---------------------------------------------------------
                        // 1. Create LayoutParams using the SAME constructor
                        //    your old working manager used.
                        // ---------------------------------------------------------
                        const lp = WMLayoutParams.$new(
                            -1, // MATCH_PARENT
                            -1, // MATCH_PARENT
                            0   // temporary type (overridden below)
                        );

                        // Set required fields using .value (old behavior)
                        lp.type.value   = WMLayoutParams.TYPE_APPLICATION_PANEL.value;
                        lp.format.value = PixelFormat.TRANSLUCENT.value;

                        // Minimal flags BEFORE attach (old behavior)
                        const FLAG_NOT_FOCUSABLE    = WMLayoutParams.FLAG_NOT_FOCUSABLE.value;
                        const FLAG_LAYOUT_IN_SCREEN = WMLayoutParams.FLAG_LAYOUT_IN_SCREEN.value;
                        const FLAG_LAYOUT_NO_LIMITS = WMLayoutParams.FLAG_LAYOUT_NO_LIMITS.value;
                        const FLAG_NOT_TOUCHABLE    = WMLayoutParams.FLAG_NOT_TOUCHABLE.value;

                        lp.flags.value =
                            FLAG_LAYOUT_IN_SCREEN |
                            FLAG_LAYOUT_NO_LIMITS |
                            FLAG_NOT_FOCUSABLE;

                        // Positioning (if you add scaling later)
                        lp.gravity.value = Gravity.TOP.value | Gravity.LEFT.value;
                        lp.x.value = 0;
                        lp.y.value = 0;

                        // Token BEFORE attach (old behavior)
                        lp.token.value = activity.getWindow().getDecorView().getWindowToken();

                        Logger("[Overlay] Attaching layout with minimal flags…");

                        // ---------------------------------------------------------
                        // 2. Attach window using the SAME addView call
                        //    your old manager used (interface dispatch).
                        // ---------------------------------------------------------
                        const ViewManager = Java.use("android.view.ViewManager");
                        ViewManager.addView
                            .overload('android.view.View', 'android.view.ViewGroup$LayoutParams')
                            .call(wm, layout, lp);

                        Logger("[Overlay] addView succeeded");

                        // ---------------------------------------------------------
                        // 3. Apply NOT_TOUCHABLE AFTER attach (critical)
                        // ---------------------------------------------------------
                        if (touchPassthrough) {
                            Logger("[Overlay] Applying NOT_TOUCHABLE after attach");
                            lp.flags.value |= FLAG_NOT_TOUCHABLE;
                            wm.updateViewLayout(layout, lp);
                        }

                        // ---------------------------------------------------------
                        // 4. Add JSBridge AFTER attach (old behavior)
                        // ---------------------------------------------------------
                        webview.addJavascriptInterface(JSBridge.$new(), "AndroidBridge");
                        Logger("[Overlay] JS interface added");
                        
                    } catch (e) {
                        Logger("[Overlay] ERROR attaching layout via WindowManager: " + e);
                    }



                    const overlayRef = {
                        name,
                        webview,
                        layout,
                        url,
                        scenes: [],
                        condition: null,

                        onHtmlMessage: (msg: string) => {
                            Logger(`[Overlay] onHtmlMessage for "${name}": ${msg}`);

                            if (msg === "htmlReady") {
                                OverlayManager.getInstance().onHtmlReady(name);
                                return;
                            }

                            // other messages later
                        }
                    };



                    self.overlays[name] = overlayRef;
                    Logger(`[Overlay] overlayRef stored for "${name}"`);
                    Logger("[Overlay] Current overlays: " + Object.keys(self.overlays).join(", "));

                    resolve();
                } catch (e) {
                    Logger(`[Overlay] ERROR in main thread for "${name}": ${e}`);
                    reject(e);
                }
            });
        });
    }
    
    getOverlay(name: string) {
        return this.overlays[name];
    }

    sendToHtml(id: string, js: string) {
        const overlay = this.overlays[id];
        if (!overlay || !overlay.webview) return;

        Java.scheduleOnMainThread(() => {
            try {
                // Use the two-argument version to avoid signature issues
                overlay.webview.evaluateJavascript(js, null);
            } catch (e) {
                Logger(`[Overlay] evaluateJavascript error: ${e}`);
            }
        });
    }

    onHtmlReady(id: string) {
        this.htmlReady[id] = true;
        Logger(`[Overlay] ${id} signaled READY. Flushing ${this.pendingMessages[id]?.length || 0} messages.`);

        (this.pendingMessages[id] || []).forEach(js => {
            this.sendToHtml(id, js);
        });

        this.pendingMessages[id] = [];
    }

}
