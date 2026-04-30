import { BossBattleOverlay } from "../overlay/BossBattleOverlay";
import { OverlayManager } from "../overlay/OverlayManager";
import { SceneOverlayManager } from "../overlay/SceneOverlayManager";

export let boss: Il2Cpp.Object | null = null;
export let bossHp: number = 0;
export let bossMaxHp: number = 0;

export function isBossActive() {
    return boss !== null;
}

export const BossRegistry = {
    // Maps that have bosses
    bossScenes: {
        "WolfOnline_Map_Lava": true,
        "WolfOnline_Map_Wild_Guardian": true,
        "WolfOnline_Map_Mountain_Guardian": true,
        "WolfOnline_Map_Snow_Guardian": true
    },
    bossCorrectMap: {
        "Mountain_Wolf_Guardian": "WolfOnline_Map_Mountain_Guardian",
        "Dragon_High": "WolfOnline_Map_Lava",
        "Wild_Wolf_Guardian": "WolfOnline_Map_Wild_Guardian",
        "Snow_Wolf_Guardian": "WolfOnline_Map_Snow_Guardian",
    },


    /** Called when boss spawns */
    setBoss(obj: Il2Cpp.Object) {
        // Read HP fields directly from IL2CPP object
        bossMaxHp = obj.field("health_Max").value as number;
        bossHp = obj.field("health").value as number;
        const js = `initialize(${JSON.stringify(SceneOverlayManager.currentScene)},${bossHp},${bossMaxHp});`;
        OverlayManager.getInstance().sendToHtml(BossBattleOverlay.OVERLAY_NAME, js);
        
        boss = obj;

        // Force overlay visibility update
        SceneOverlayManager.getInstance().onSceneChanged(
            SceneOverlayManager.currentScene
        );
    },

    /** Called when boss dies */
    clearBoss() {
        Logger("Boss cleared >> " + boss.toString() + " hp/max " + bossHp.toString() + "/" + bossMaxHp.toString() )
        boss = null;
        bossHp = 0;
        bossMaxHp = 0;

        // Force overlay visibility update
        SceneOverlayManager.getInstance().onSceneChanged(
            SceneOverlayManager.getInstance().lastScene
        );
    },

    /** HTML calls this when damage is dealt */
    dealDamage(amount: number, critHit: boolean) {
        if (!boss) return;

        // Update internal HP
        bossHp -= amount;
        if (bossHp < 0) bossHp = 0;

        // HTML has: dealDamage(amount, critHit)
        OverlayManager.getInstance().sendToHtml(
            BossBattleOverlay.OVERLAY_NAME,
            `dealDamage(${amount}, ${critHit});`
        );
    },

    /** Returns true if this scene has a boss */
    hasBossForScene(scene: string) {
        return this.bossScenes.hasOwnProperty(scene);
    },

    /** Returns true if boss exists AND scene has a boss */
    isBossActive(scene: string) {
        Logger("Boss active? " + BossRegistry.isBossActive(scene));
        Logger("boss value: " + boss);
        Logger("hasBossForScene: " + BossRegistry.hasBossForScene(scene));

        return this.hasBossForScene(scene) && boss !== null;
    }
};
