import Java from 'frida-java-bridge'
import { configManager } from '../config/ConfigManager';
import { ModOverlay_HUD } from './ModOverlay_HUD';
import { BossBattleOverlay } from './BossBattleOverlay';
import { NameGenOverlay } from './NameGenOverlay';
import { SceneOverlayManager } from './SceneOverlayManager';
import { updateID } from '../hooks/inputid';

export enum OverlayLayer {
    BACKGROUND = 0,
    HUD = 10,
    ESP = 20,
    MENU = 38,
    DEBUG = 40
}

let counter = 0;

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

    
    createOverlay(
        name: string,
        url: string,
        touchPassthrough: boolean = true,
        layer: OverlayLayer = OverlayLayer.HUD
    ): Promise<void> {

        Logger(`[Overlay] createOverlay START for "${name}"`);
        const self = this;

        return new Promise((resolve, reject) => {
            Java.scheduleOnMainThread(() => {
                try {
                    // Logger("Here 1 — Begin WebView setup");

                    // ---------------------------------------------------------
                    // 1. WebView + Layout (same as old working version)
                    // ---------------------------------------------------------
                    const WebView = Java.use("android.webkit.WebView");
                    const FrameLayout = Java.use("android.widget.FrameLayout");
                    const FrameLayoutParams = Java.use("android.widget.FrameLayout$LayoutParams");
                    const View = Java.use("android.view.View");

                    const webview = WebView.$new(self.context);
                    webview.setLayerType(View.LAYER_TYPE_HARDWARE.value, null);
                    webview.setClickable(false);
                    webview.setLongClickable(false);
                    webview.setFocusable(false);
                    webview.setFocusableInTouchMode(false);
                    webview.setBackgroundColor(0x00000000);

                    // Logger("Here 2 — WebView created");

                    const settings = webview.getSettings();
                    settings.setJavaScriptEnabled(true);
                    settings.setDomStorageEnabled(true);
                    settings.setUseWideViewPort(false);
                    settings.setLoadWithOverviewMode(false);
                    settings.setSupportZoom(false);
                    settings.setBuiltInZoomControls(false);
                    settings.setDisplayZoomControls(false);

                    // Logger("Here 3 — WebView settings applied");

                    const layout = FrameLayout.$new(self.context);
                    const flParams = FrameLayoutParams.$new(-1, -1);
                    layout.addView(webview, flParams);

                    // Logger("Here 4 — Layout created and WebView added");

                    // ---------------------------------------------------------
                    // 2. WindowManager (same as old working version)
                    // ---------------------------------------------------------
                    const UnityPlayer = Java.use("com.unity3d.player.UnityPlayer");
                    const activity = UnityPlayer.currentActivity.value;

                    const WindowManager = Java.use("android.view.WindowManager");
                    const WMLayoutParams = Java.use("android.view.WindowManager$LayoutParams");
                    const PixelFormat = Java.use("android.graphics.PixelFormat");
                    const Gravity = Java.use("android.view.Gravity");

                    const wm = Java.cast(activity.getSystemService("window"), WindowManager);

                    // Logger("Here 5 — WindowManager acquired");

                    // ---------------------------------------------------------
                    // 3. LayoutParams (EXACT constructor your old version used)
                    // ---------------------------------------------------------
                    // const lp = WMLayoutParams.$new(-1, -1, 0);
                    const lp = WMLayoutParams.$new(
                        -1, // width
                        -1, // height
                        WMLayoutParams.TYPE_APPLICATION_PANEL.value, // type
                        0,  // flags (we set them after)
                        PixelFormat.TRANSLUCENT.value // format
                    );


                    // Set fields using .value (old behavior)
                    lp.type.value = WMLayoutParams.TYPE_APPLICATION_PANEL.value;
                    lp.format.value = PixelFormat.TRANSLUCENT.value;

                    lp.gravity.value = Gravity.TOP.value | Gravity.LEFT.value;
                    lp.x.value = 0;
                    lp.y.value = 0;

                    // Logger("Here 6 — LayoutParams positioned");

                    // ---------------------------------------------------------
                    // 4. Flags (old working order)
                    // ---------------------------------------------------------
                    const FLAG_NOT_FOCUSABLE = WMLayoutParams.FLAG_NOT_FOCUSABLE.value;
                    const FLAG_NOT_TOUCHABLE = WMLayoutParams.FLAG_NOT_TOUCHABLE.value;
                    const FLAG_LAYOUT_IN_SCREEN = WMLayoutParams.FLAG_LAYOUT_IN_SCREEN.value;
                    const FLAG_LAYOUT_NO_LIMITS = WMLayoutParams.FLAG_LAYOUT_NO_LIMITS.value;

                    lp.flags.value =
                        FLAG_LAYOUT_IN_SCREEN |
                        FLAG_LAYOUT_NO_LIMITS |
                        FLAG_NOT_FOCUSABLE;

                    if (touchPassthrough) {
                        lp.flags.value |= FLAG_NOT_TOUCHABLE;
                    }

                    // Logger("Here 7 — Flags applied");

                    // ---------------------------------------------------------
                    // 5. Token (old working timing)
                    // ---------------------------------------------------------
                    lp.token.value = activity.getWindow().getDecorView().getWindowToken();

                    // Logger("Here 8 — Token assigned, calling addView…");

                    // ---------------------------------------------------------
                    // 6. addView (EXACT old working call)
                    // ---------------------------------------------------------
                    const ViewManager = Java.use("android.view.ViewManager");
                    ViewManager.addView
                        .overload('android.view.View', 'android.view.ViewGroup$LayoutParams')
                        .call(wm, layout, lp);

                    // Logger("Here 9 — addView succeeded");

                    // ---------------------------------------------------------
                    // 7. Z-layer AFTER attach
                    // ---------------------------------------------------------
                    try {
                        layout.setZ(layer);
                        // Logger("Here 10 — Z-layer applied");
                    } catch (e) {
                        Logger("Here 10 — Z-layer failed but safe");
                    }

                    // ---------------------------------------------------------
                    // 8. JSBridge AFTER addView
                    // ---------------------------------------------------------
                    const JSBridge = Java.registerClass({
                        name: "com.overlay.JSBridge_" + name,
                        methods: {
                            getInitialData: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String'],
                                implementation: function (jsonString: string) {
                                    try {
                                        const data = JSON.parse(jsonString);

                                        if (data.type === "READY") {
                                            self.onHtmlReady(data.overlay);
                                        }
                                        if (data.overlay === ModOverlay_HUD.OVERLAY_NAME){
                                            Logger(`initialize(${configManager.get('currentTier')},${configManager.get('currentDeathTier')},${configManager.get('honorScore')},${configManager.get('aidScore')});`);
                                            const js = `initialize(${configManager.get('currentTier')},${configManager.get('currentDeathTier')},${configManager.get('honorScore')},${configManager.get('aidScore')});`;
                                            OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
                                            SceneOverlayManager.getInstance().onSceneChanged(
                                                SceneOverlayManager.currentScene
                                            );
                                        }
                                    } catch (e) {
                                        Logger("[Overlay] Bridge Error: " + e);
                                    }
                                }
                            },
                            sendToMod: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String'],
                                implementation: function (jsonString: string) {
                                    try {
                                        const data = JSON.parse(jsonString);

                                        if (data.type === "READY") {
                                            self.onHtmlReady(data.overlay);
                                        }
                                        if (data.overlay === ModOverlay_HUD.OVERLAY_NAME){
                                        }
                                        if ( data.overlay === NameGenOverlay.OVERLAY_NAME ){
                                           // Run this in the background so Java doesn't wait
                                            setTimeout(() => {
                                                Il2Cpp.perform(() => {
                                                    updateID(data.gradientName);
                                                });
                                            }, 0); 
                                        }

                                    } catch (e) {
                                        Logger("[Overlay] Bridge Error: " + e);
                                    }
                                }
                            },
                            redrawOverlay: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String', 'boolean'],
                                implementation: function (jsonString: string, contentOpen: boolean) {
                                    try {
                                        const data = JSON.parse(jsonString);
                                        const mgr = OverlayManager.getInstance();

                                        const dm = Java.use("android.content.res.Resources").getSystem().getDisplayMetrics();
                                        const width = dm.widthPixels.value;
                                        const height = dm.heightPixels.value;

                                        const overlay = mgr.getOverlay(data.overlay);
                                        const lp = overlay.windowLayoutParams;
                                        const webview = overlay.webview;
                                        const FLAG_NOT_FOCUSABLE = 8;

                                        if (data.overlay === NameGenOverlay.OVERLAY_NAME) {
                                            Java.scheduleOnMainThread(() => {
                                                try {
                                                    if (contentOpen) {
                                                        // 1. Let your manager handle geometry (size/pos)
                                                        mgr.updateWindowGeometry(data.overlay, 0, 0, Math.round(width), Math.round(height));

                                                        // 2. Toggle Flags and WebView Focus
                                                        lp.flags.value &= ~FLAG_NOT_FOCUSABLE;
                                                        webview.setFocusable(true);
                                                        webview.setFocusableInTouchMode(true);
                                                    } else {
                                                        // Tiny Button State with Rounded Integers
                                                        const targetWidth = Math.round(width * 0.20);
                                                        const targetHeight = Math.round(height * 0.10);
                                                        const xOffset = Math.round(width * 0.155);
                                                        const yOffset = Math.round(Math.min(width, height) * 0.10);

                                                        // 1. Let your manager handle geometry (tiny size/pos)
                                                        mgr.updateWindowGeometry(data.overlay, xOffset, yOffset, targetWidth, targetHeight);

                                                        // 2. Toggle Flags and WebView Focus
                                                        lp.flags.value |= FLAG_NOT_FOCUSABLE;
                                                        webview.setFocusable(false);
                                                        webview.setFocusableInTouchMode(false);
                                                    }

                                                    // 3. Push the FLAG changes specifically on UI Thread
                                                    const ViewManager = Java.use("android.view.ViewManager");
                                                    ViewManager.updateViewLayout
                                                        .overload('android.view.View', 'android.view.ViewGroup$LayoutParams')
                                                        .call(overlay.windowManager, overlay.layout, lp);

                                                } catch (innerError) {
                                                    Logger("[Overlay] UI Thread Error: " + innerError);
                                                }
                                            });
                                        }
                                    }
                                    catch (e) {
                                        Logger("[Overlay] Bridge Error redrawOverlay: " + e);
                                    }
                                }
                            },

                            requestDeviceSize: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String'],
                                implementation: function (jsonString: string) {
                                    try {
                                        const data = JSON.parse(jsonString);

                                        // Get device resolution in Java
                                        const dm = Java.use("android.content.res.Resources").getSystem().getDisplayMetrics();
                                        const width = dm.widthPixels.value;
                                        const height = dm.heightPixels.value;

                                        // Send JS call to HTML
                                        Logger(`setSize(${width}, ${height});` + ` overlay: ${data.overlay}`);
                                        const js = `setSize(${width}, ${height});`;
                                        OverlayManager.getInstance().sendToHtml(data.overlay, js);
                                    }
                                    catch (e) {
                                        Logger("[Overlay] Bridge Error requestDeviceSize: " + e);
                                    }
                                }
                            },
                            delayedDraw: {
                                returnType: 'void',
                                argumentTypes: ['java.lang.String'],
                                implementation: function( jsonString: string) {
                                    try {
                                        const data = JSON.parse(jsonString);
                                        // Force overlay visibility update
                                        Logger("delayedDraw")
                                        SceneOverlayManager.getInstance().onSceneChanged(
                                            SceneOverlayManager.currentScene
                                        );
                                        
                                    }
                                    catch (e) {
                                        Logger("[Overlay] Bridge Error requestDeviceSize: " + e);
                                    }
                                }
                            }
                        }
                    });

                    webview.addJavascriptInterface(JSBridge.$new(), "AndroidBridge");

                    // Logger("Here 11 — JSBridge added");

                    // ---------------------------------------------------------
                    // 9. Load HTML (old working timing)
                    // ---------------------------------------------------------
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
                                    const u = URL.$new(url);
                                    const stream = u.openStream();
                                    const scanner = Scanner.$new(stream, "UTF-8");
                                    scanner.useDelimiter(Pattern.quote("\\A"));
                                    const html = scanner.hasNext() ? scanner.next() : "";
                                    scanner.close();

                                    Java.scheduleOnMainThread(() => {
                                        webview.loadDataWithBaseURL(
                                            "file:///android_asset/",
                                            html,
                                            "text/html; charset=UTF-8",
                                            "UTF-8",
                                            null
                                        );
                                    });

                                } catch (e) {
                                    Logger("[Overlay] HTML fetch error: " + e);
                                }
                            }
                        }
                    });

                    Thread.$new(RunnableImpl.$new()).start();

                    // Logger("Here 12 — HTML fetch thread started");

                    // ---------------------------------------------------------
                    // 10. Store overlay reference
                    // ---------------------------------------------------------
                    self.overlays[name] = {
                        name,
                        webview,
                        layout,
                        windowManager: wm,
                        windowLayoutParams: lp
                    };

                    // Logger("Here 13 — Overlay stored");

                    resolve();

                } catch (e) {
                    Logger(`[Overlay] ERROR in createOverlay for "${name}": ${e}`);
                    reject(e);
                }
            });
        });
    }
    

    resizeWindow(name: string, width: number, height: number) {
        const overlay = this.overlays[name];
        if (!overlay) return;

        Java.scheduleOnMainThread(() => {
            try {
                overlay.windowLayoutParams.width = width;
                overlay.windowLayoutParams.height = height;

                overlay.windowManager.updateViewLayout(
                    overlay.layout,
                    overlay.windowLayoutParams
                );

                Logger(`[Overlay] Window resized for "${name}" to ${width}x${height}`);
            } catch (e) {
                Logger(`[Overlay] resizeWindow ERROR for "${name}": ${e}`);
            }
        });
    }

    moveWindow(name: string, x: number, y: number) {
        const overlay = this.overlays[name];
        if (!overlay) return;

        Java.scheduleOnMainThread(() => {
            try {
                overlay.windowLayoutParams.x = x;
                overlay.windowLayoutParams.y = y;

                overlay.windowManager.updateViewLayout(
                    overlay.layout,
                    overlay.windowLayoutParams
                );

                Logger(`[Overlay] Window moved for "${name}" to x=${x}, y=${y}`);
            } catch (e) {
                Logger(`[Overlay] moveWindow ERROR for "${name}": ${e}`);
            }
        });
    }

    updateWindowGeometry(name, x, y, width, height) {
        const overlay = this.overlays[name];
        if (!overlay) return;

        Java.scheduleOnMainThread(() => {
            try {
                const lp = overlay.windowLayoutParams;

                lp.x.value = x;
                lp.y.value = y;
                lp.width.value = width;
                lp.height.value = height;

                const ViewManager = Java.use("android.view.ViewManager");
                ViewManager.updateViewLayout
                    .overload('android.view.View', 'android.view.ViewGroup$LayoutParams')
                    .call(overlay.windowManager, overlay.layout, lp);

                Logger(`[Overlay] Geometry updated for "${name}" → x=${x}, y=${y}, w=${width}, h=${height}`);
            } catch (e) {
                Logger(`[Overlay1] updateWindowGeometry ERROR for "${name}": ${e}`);
            }
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
