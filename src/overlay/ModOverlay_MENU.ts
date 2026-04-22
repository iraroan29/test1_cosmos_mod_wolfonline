// overlay/BossBattleOverlay.ts
import { configManager } from "../config/ConfigManager";
import { isPlayerActive, SharedState } from "../helpers/playerWolfStore";
import { OverlayLayer, OverlayManager } from "./OverlayManager";
import { SceneOverlayManager } from "./SceneOverlayManager";

export class ModOverlay_MENU {
    public static readonly OVERLAY_NAME = "ModMenuOverlay";

    constructor(url: string) {
        (async () => {
            await OverlayManager.getInstance().createOverlay(ModOverlay_MENU.OVERLAY_NAME, url, false, OverlayLayer.MENU, 200, 200);

            Logger("[ModOverlay MENU] Overlay created, now registering scenes");

            SceneOverlayManager.getInstance().registerOverlayScenes(
                ModOverlay_MENU.OVERLAY_NAME,
                Object.keys({
                    "WolfOnline_Map_Snow": true,
                    "WolfOnline_Map_Snow_Guardian": true,
                    "WolfOnline_Map_Mountain": true,
                    "WolfOnline_Map_Mountain_Guardian": true,
                    "WolfOnline_Map_Wild": true,
                    "WolfOnline_Map_Wild_Guardian": true,
                    "WolfOnline_Map_Lava": true,
                    "WolfOnline_Map_Fish": true,
                    "WolfOnline_Map_BlackTiger": true,
                    "WolfOnline_Map_Wild_Dog": true,
                    "WolfOnline_Map_Field": true,
                    "WolfOnline_Map_Hellgate_0": true,
                    "WolfOnline_Map_WolfAndDino": true
                }),
                () => isPlayerActive()
            );

            SceneOverlayManager.getInstance().onSceneChanged(
                SceneOverlayManager.currentScene
            );
        })();
    }    


}


