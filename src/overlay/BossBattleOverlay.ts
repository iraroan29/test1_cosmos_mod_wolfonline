// overlay/BossBattleOverlay.ts
import { BossRegistry, isBossActive } from "../helpers/bossRegistry";
import { OverlayManager } from "./OverlayManager";
import { SceneOverlayManager } from "./SceneOverlayManager";

export class BossBattleOverlay {
    public static readonly OVERLAY_NAME = "bossOverlay";

    constructor(url: string) {
        (async () => {
            await OverlayManager.getInstance().createOverlay(BossBattleOverlay.OVERLAY_NAME, url, true);

            Logger("[BossOverlay] Overlay created, now registering scenes");

            SceneOverlayManager.getInstance().registerOverlayScenes(
                BossBattleOverlay.OVERLAY_NAME,
                Object.keys(BossRegistry.bossScenes),
                () => isBossActive()
            );

            SceneOverlayManager.getInstance().onSceneChanged(
                SceneOverlayManager.currentScene
            );
        })();
    }

    // Optional: TS → HTML health update (HTML handles visuals)
    updateHealth(current: number, max: number) {
        const js = `updateHealth(${current}, ${max});`;
        OverlayManager.getInstance().sendToHtml(BossBattleOverlay.OVERLAY_NAME, js);
    }
}
