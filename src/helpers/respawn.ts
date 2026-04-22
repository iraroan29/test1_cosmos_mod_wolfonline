import { configManager } from "../config/ConfigManager";
import { SharedState } from "./playerWolfStore";

export let spawnCloneFlag = false;
export function resetCloneFlag(){
    spawnCloneFlag = false;
}

export function respawn(){
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const coreAssembly = Il2Cpp.domain.assembly("UnityEngine.CoreModule");
        
    if (!assemblyC || !coreAssembly) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp || Unity not ready for respawn, retrying...");
        setTimeout(respawn, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const UnityCore = coreAssembly.image;
    const PhotonNetwork = AssemblyC.class("PhotonNetwork");
    const gameObject = UnityCore.class("UnityEngine.GameObject");

    const player = gameObject
        .method<Il2Cpp.Object>("FindWithTag")
        .invoke(Il2Cpp.string("Player")) as Il2Cpp.Object;

    if (!player) return;
    const transform = player.method("get_transform").invoke() as Il2Cpp.Object;
    const playerPosition = transform.method("get_position").invoke() as Il2Cpp.Object;
    const playerRotation = transform.method("get_rotation").invoke() as Il2Cpp.Object;
    
    SharedState.spawningClone = true;

    PhotonNetwork.method<Il2Cpp.Object>("Instantiate")
                .invoke(Il2Cpp.string(SharedState.wolfType), playerPosition, playerRotation, 0);
    
}

export function initRespawnUpdates(){
    configManager.onUpdate('currentTier', (tier) => respawn());
    configManager.onUpdate('isSubtierUnlocked', (unlocked) => {
        if(unlocked) respawn();
    });
}