import { activePlayer, SharedState } from "../helpers/playerWolfStore";

export function playerRespawnAwake() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for playerRespawnAwake, retrying...");
        setTimeout(playerRespawnAwake, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");
    const PhotonNetwork = AssemblyC.class("PhotonNetwork");

    Player_Wolf.method("Awake").implementation = function(){
        // --- NEW: Only run logic for YOUR wolf ---
        const pv = this.field<Il2Cpp.Object>("_PhotonView").value;
        const isMine = pv.method("get_isMine").invoke();
        if (!isMine) {
            return this.method("Awake").invoke();
        }
        // -----------------------------------------
        const go = (this as Il2Cpp.Object).method("get_gameObject").invoke() as Il2Cpp.Object;

        // CASE 1 — spawningClone == true
        if (SharedState.spawningClone) {
            Logger("Destroy Older Body")
            SharedState.spawningClone = false;

            // Move old realBody → pendingOldBody
            SharedState.pendingOldBody = activePlayer;

            // New body becomes the realBody
            SharedState.setBody(go);

            // Destroy pendingOldBody if it exists
            if (SharedState.pendingOldBody) {
                PhotonNetwork.method("Destroy").overload("UnityEngine.GameObject")
                            .invoke(SharedState.pendingOldBody);

                SharedState.pendingOldBody = null;
            }

            return this.method("Awake").invoke();
        }
        // CASE 2 — spawningClone == false
        // This is a real body (first spawn or rebuild)
        const pvString = this.field("_PhotonView").value.toString();
        SharedState.wolfType = pvString.match(/View \(0\)\d+ on (.*?)\(Clone\)/)[1];
        SharedState.setBody(go, true);
    
        return this.method("Awake").invoke();
    }

    Logger("[+] playerRespawnAwake successfully initialized!");
}