import { SceneOverlayManager } from "../overlay/SceneOverlayManager";

export let activePlayer: Il2Cpp.Object | null = null;

export function isPlayerActive() {
    return activePlayer !== null;
}
export function setPlayerActive() {
    activePlayer 
}

export const SharedState = {
    spawningClone: false,
    pendingOldBody: null as Il2Cpp.Object | null,
    wolfType: "" as string,


    setBody(obj: Il2Cpp.Object, forOverlay: boolean = false){
        activePlayer = obj;

        if(forOverlay){
            // Force overlay visibility update
            SceneOverlayManager.getInstance().onSceneChanged(
                SceneOverlayManager.currentScene
            );
        }
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