import { SceneOverlayManager } from "../overlay/SceneOverlayManager";

export let activePlayer: Il2Cpp.Object | null = null;

export function isPlayerActive() {
    return activePlayer !== null;
}

export const SharedState = {
    spawningClone: false,
    pendingOldBody: null as Il2Cpp.Object | null,
    wolfType: "" as string,


    setBody(obj: Il2Cpp.Object){
        activePlayer = obj;

        // Force overlay visibility update
        SceneOverlayManager.getInstance().onSceneChanged(
            SceneOverlayManager.currentScene
        );
    },
    clearBody(){
        activePlayer = null;
        this.pendingOldBody = null;

        // Force overlay visibility update
        SceneOverlayManager.getInstance().onSceneChanged(
            SceneOverlayManager.currentScene
        );
    }
};