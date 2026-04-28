// overlay/BossBattleOverlay.ts
import { configManager } from "../config/ConfigManager";
import { isPlayerActive, SharedState } from "../helpers/playerWolfStore";
import { OverlayLayer, OverlayManager } from "./OverlayManager";
import { SceneOverlayManager } from "./SceneOverlayManager";

export class NameGenOverlay {
    public static readonly OVERLAY_NAME = "NameGenOverlay";

    constructor(url: string) {
        (async () => {
            await OverlayManager.getInstance().createOverlay(NameGenOverlay.OVERLAY_NAME, url, false, OverlayLayer.MENU);

            Logger("[NameGenOverlay] Overlay created, now registering scenes");

            SceneOverlayManager.getInstance().registerOverlayScenes(
                NameGenOverlay.OVERLAY_NAME,
                Object.keys({
                    "WolfOnline_Map_Select_Wolf": true
                })
            );

            SceneOverlayManager.getInstance().onSceneChanged(
                SceneOverlayManager.currentScene
            );
        })();
    }    


}


