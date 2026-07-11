// overlay/SceneOverlayManager.ts
import Java from 'frida-java-bridge'
import { BossRegistry } from "../helpers/bossRegistry";
import { OverlayManager } from "./OverlayManager";
import { SharedState } from '../helpers/playerWolfStore';

export class SceneOverlayManager {
    private static instance: SceneOverlayManager;
    private initialized = false;
    static currentScene;

    lastScene: string = "";

    static getInstance(): SceneOverlayManager {
        if (!this.instance) this.instance = new SceneOverlayManager();
        Logger("Debug 1");
        return this.instance;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
        Logger("Debug 2");
        const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
        const core = Il2Cpp.domain.assembly("UnityEngine.CoreModule");

        // 2. Safety Check: Ensure ALL required modules are loaded
        if (!assemblyC || !core) {
            Logger("[!] Unity not ready for SceneOverlayManager");
            return;
        }

        Logger("Debug 3");
        const UnityCoreImage = core.image;
        const SceneManager = UnityCoreImage.class("UnityEngine.SceneManagement.SceneManager");

        // Hook Internal_SceneLoaded
        SceneManager.method("Internal_SceneLoaded").implementation = function(scene, mode){
            const sceneName = (scene as Il2Cpp.Object).method<Il2Cpp.String>("get_name").invoke().content;
            
            Logger("Debug 4");
            SceneOverlayManager.currentScene = sceneName;
            SceneOverlayManager.getInstance().onSceneChanged(sceneName);
            // // Master Client?
            // PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method<Il2Cpp.Object>("get_player").invoke());
            return this.method("Internal_SceneLoaded").invoke(scene, mode);
        }

        // Hook Internal_SceneUnloaded
        SceneManager.method("Internal_SceneUnloaded").implementation = function(scene, mode){
            
            Logger("Debug 5");
            // Clear boss when leaving ANY scene
            BossRegistry.clearBoss();
            // Clear saved player body
            SharedState.clearBody();

            return this.method("Internal_SceneUnloaded").invoke(scene, mode);
        }

        Logger("[*] SceneOverlayManager - Scene hooks installed");
    }

    registerOverlayScenes(
        overlayName: string,
        scenes: string[],
        condition?: (sceneName: string) => boolean
    ) {
        const overlay = OverlayManager.getInstance().getOverlay(overlayName);
        if (overlay) {
            overlay.scenes = scenes;
            overlay.condition = condition || null;
        }
        Logger("Register Overlay Scenes End >> " + overlay.scenes + " -- condition >> "  + overlay.condition);
    }

    onSceneChanged(sceneName: string) {
        Logger("\nonSceneChanged ENTER: [" + sceneName + "]");
        this.lastScene = sceneName;

        const overlayManager = OverlayManager.getInstance();

        Java.scheduleOnMainThread(() => {
            Object.values(overlayManager["overlays"]).forEach((overlay: any) => {
                if (!overlay.scenes) return;

                const sceneMatch = overlay.scenes.includes(sceneName);

                // ⭐ Evaluate the overlay's condition function if it exists
                const conditionMatch = overlay.condition
                    ? overlay.condition(sceneName)
                    : true;
                const shouldShow = sceneMatch && conditionMatch;

                overlay.layout.setVisibility(shouldShow ? 0 : 4);
            });
        });
    }


}
