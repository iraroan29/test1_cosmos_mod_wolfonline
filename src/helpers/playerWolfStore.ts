export let activePlayer: Il2Cpp.Object | null = null;
export const SharedState = {
    spawningClone: false,
    pendingOldBody: null as Il2Cpp.Object | null,
    realBody: null as Il2Cpp.Object | null,
    wolfType: "" as string,
};

export function isPlayerActive() {
    return activePlayer !== null;
}

export function setPlayer(obj: Il2Cpp.Object){
    activePlayer = obj;
}