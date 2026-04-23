import { boss, BossRegistry } from "../helpers/bossRegistry";
import { SceneOverlayManager } from "../overlay/SceneOverlayManager";

export function WildBossHooks() {

    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        Logger("[!] Assembly-CSharp not ready for WildBossHooks, retrying...");
        setTimeout(WildBossHooks, 500);
        return;
    }
    
    const AssemblyC = assemblyC.image;
    const WildBoss = AssemblyC.class("Attack_Animals_Wild_Wolf_Guardian");
    const PhotonNetwork = AssemblyC.class("PhotonNetwork");

    // Update Function 
    WildBoss.method("Update").implementation = function () {
        const scene = SceneOverlayManager.currentScene;
        const bossGO = this.method("get_gameObject").invoke() as Il2Cpp.Object;
        const bossType = "Wild_Wolf_Guardian";
        const correctMap = BossRegistry.bossCorrectMap[bossType];

        // 1. If this is NOT the correct map for THIS boss → destroy it
        if (!scene.includes(correctMap)) {
            PhotonNetwork.method("Destroy")
                .overload("UnityEngine.GameObject")
                .invoke(bossGO);
            return;
        }

        // 2. Scene IS the correct map → enforce ONE boss per scene

        // If no boss registered yet → claim this one
        const hp = this.field<number>("health").value;
        if (boss === null && hp > 0) {
            // If not master client && no other mod user is on map and is master client (check if photon view name contains hidden characters);
            if(!PhotonNetwork.method<boolean>("get_isMasterClient").invoke()){
                PhotonNetwork.method("SetMasterClient").invoke(PhotonNetwork.method<Il2Cpp.Object>("get_player").invoke());
            }
            
            Logger("Master Client >> " + PhotonNetwork.method<Il2Cpp.Object>("get_masterClient").invoke().toString());
            BossRegistry.setBoss(this as Il2Cpp.Object, scene);
            return this.method("Update").invoke();
        }

        // If this is NOT the registered boss → destroy it
        if (!boss.equals(this as Il2Cpp.Object)) {
            PhotonNetwork.method("Destroy")
                .overload("UnityEngine.GameObject")
                .invoke(bossGO);
            return;
        }

        // If this IS the registered boss → run normal Update
        return this.method("Update").invoke();
    };

    // Death Function
    WildBoss.method("Death").implementation = function () {
        BossRegistry.clearBoss();
        return this.method("Death").invoke();
    };

    // Damage Function 
    WildBoss.method("Damage").implementation = function(damage) {
        let roll = Math.floor(Math.random() * 101); // 0 -> 100
        let dmg = damage as number;
        let critHit = false;
        // Store actualDmgMax to set it back after
        let damageMax = this.field<number>("damage_max").value;
        if(roll <= 5) {
            this.field<number>("damage_max").value = 200;
            critHit = true;
            dmg *= 5;
        }
        this.method("Damage").invoke(dmg);
        BossRegistry.dealDamage(this.field<number>("health").value, critHit);
        return this.field<number>("damage_max").value = damageMax;
    }

    Logger("[+] WildBossHooks successfully initialized!");
}
