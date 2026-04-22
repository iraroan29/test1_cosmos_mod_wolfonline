// overlay/BossBattleOverlay.ts
import { configManager } from "../config/ConfigManager";
import { isPlayerActive, SharedState } from "../helpers/playerWolfStore";
import { OverlayManager } from "./OverlayManager";
import { SceneOverlayManager } from "./SceneOverlayManager";

export class ModOverlay_HUD {
    public static readonly OVERLAY_NAME = "ModHUDOverlay";
    public static TIER = 0;
    public static AID = 0;
    public static HONOR = 0;
    public static DEATHTIER = 0;

    constructor(url: string) {
        (async () => {
            await OverlayManager.getInstance().createOverlay(ModOverlay_HUD.OVERLAY_NAME, url, false);

            Logger("[ModOverlay HUD] Overlay created, now registering scenes");

            SceneOverlayManager.getInstance().registerOverlayScenes(
                ModOverlay_HUD.OVERLAY_NAME,
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

            // Initialize 4 main statuses for showing banners 
            ModOverlay_HUD.TIER = configManager.get('currentTier');
            ModOverlay_HUD.AID = configManager.get('aidScore');
            ModOverlay_HUD.DEATHTIER = configManager.get('currentDeathTier');
            ModOverlay_HUD.HONOR = configManager.get('honorScore');
        })();
    }    

    // Optional: TS → HTML health update (HTML handles visuals)
    bannerMessage(message: string, negativeAffect: boolean = false) {
        const js = `setPopupBanner(${JSON.stringify(message)}, ${negativeAffect});`;
        OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
    }

}
configManager.onUpdate('currentTier', (tier) => {
    const js = `setTierByValue(${tier});`;
    OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
});
configManager.onUpdate('currentDeathTier', (deathTier) => {
    const js = `setDeathTier(${deathTier});`;
    OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
});
configManager.onUpdate('honorScore', (honor) => {
    const js = `setHonor(${honor});`;
    OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
});
configManager.onUpdate('aidScore', (aid) => {
    const js = `setAid(${aid});`;
    OverlayManager.getInstance().sendToHtml(ModOverlay_HUD.OVERLAY_NAME, js);
});

