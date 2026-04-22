import "frida-il2cpp-bridge";
import Java from 'frida-java-bridge'
import { configManager } from "./config/ConfigManager";

import { immortalTesting } from "./tmpHooks/immortality";
import { givePoints } from "./hooks/givePoints";
import { hudName } from "./hooks/hudName";
import { initRespawnUpdates } from "./helpers/respawn";
import { playerRespawnAwake } from "./hooks/playerRespawnAwake";
import { playerUpdate } from "./hooks/playerUpdate";
import { honorAndPointLimiter } from "./hooks/honor_pointLimiter";
import { ensureDamageTaken } from "./hooks/ensureDamageTaken";
import { deathCounter } from "./hooks/death";
import { multiAttack } from "./hooks/multi_attack";
import { OverlayManager } from "./overlay/OverlayManager";
import { SceneOverlayManager } from "./overlay/SceneOverlayManager";
import { BossBattleOverlay } from "./overlay/BossBattleOverlay";
import { MountainBossHooks } from "./bossHooks/mountainHooks";
import { stealMasterClient } from "./hooks/masterclient";
import { DragonBossHooks } from "./bossHooks/dragonHooks";
import { SnowBossHooks } from "./bossHooks/snowHooks";
import { WildBossHooks } from "./bossHooks/wildHooks";
import { inputID } from "./hooks/inputid";
import { ModOverlay_HUD } from "./overlay/ModOverlay_HUD";
import { ModOverlay_MENU } from "./overlay/ModOverlay_MENU";

let Log: any = null;

(globalThis as any).Logger = function(message: string) {
    if (Log) {
        Log.v("FRIDA_SCRIPT", message);
    } else {
        console.log(`[FRIDA_SCRIPT] ${message}`);
    }
};

Java.perform(async() => {

    // 1. PLACE THE BYPASS HERE (Right at the start)
    const Executable = Java.use('java.lang.reflect.Executable');
    Executable.isAnnotationPresent.implementation = function (annotationClass) {
        if (annotationClass.getName() === "android.webkit.JavascriptInterface") {
            return true; 
        }
        return this.isAnnotationPresent(annotationClass);
    };

    const WebView = Java.use("android.webkit.WebView");
    
    // Force the WebView to be clickable
    WebView.$init.overload('android.content.Context').implementation = function(ctx) {
        this.$init(ctx);
        this.setClickable(true);
    };

    // Optional: Hook dispatchTouchEvent to log if touches are even hitting the WebView
    WebView.dispatchTouchEvent.implementation = function(event) {
        // If this logs, the touch is reaching the WebView!
        // Logger("[WebView] Touch received: " + event.getAction());
        return this.dispatchTouchEvent(event);
    };


    Log = Java.use("android.util.Log");
    Logger("Load GameConfig");
    await configManager.init();

    const context = Java.use("android.app.ActivityThread").currentApplication().getApplicationContext();

    Il2Cpp.perform(() => {
        Logger(" 3   ------------")
        // ----- Overlay Initializing ------------ //
        OverlayManager.getInstance().initialize(context);
        SceneOverlayManager.getInstance().initialize();
        
        // ----- GUI Hooks ----------------------- //
        Logger("    ------------")
        // configDisplay();

        // ----- Functionality Hooks ------------- //
        Logger("    ------------")
        inputID();
        hudName();
        givePoints();
        playerUpdate();
        playerRespawnAwake();
        honorAndPointLimiter();
        ensureDamageTaken();
        deathCounter();
        multiAttack();


        // ----- Temporary Hooks for Testing ----- //
        Logger("    ------------")
        // honorAttackTesting();
        immortalTesting();
        stealMasterClient();

        // ----- Initialize Listeners ------------- //
        initRespawnUpdates();

        // ----- Boss Hooks ----------------------- //
        MountainBossHooks();
        DragonBossHooks();
        SnowBossHooks();
        WildBossHooks();

        // ----- Overlay creation
        new ModOverlay_HUD("https://raw.githubusercontent.com/iraroan29/test1_cosmos_mod_wolfonline/refs/heads/main/src/overlayHTML/ModOverlay_HUD.html");
        new ModOverlay_MENU("https://raw.githubusercontent.com/iraroan29/test1_cosmos_mod_wolfonline/refs/heads/main/src/overlayHTML/ModOverlay_MENU.html");
        new BossBattleOverlay("https://raw.githubusercontent.com/iraroan29/test1_cosmos_mod_wolfonline/refs/heads/main/src/overlayHTML/BossBattle.html");

        Logger("    ------------")
        Logger("\n[+] Successfully Completed All Hooks");
    });
});