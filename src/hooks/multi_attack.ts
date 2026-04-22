import { configManager } from "../config/ConfigManager";

export function multiAttack() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for multiAttack, retrying...");
        setTimeout(multiAttack, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const RPC_Damage = AssemblyC.class("RPC_Damage");
    RPC_Damage.method("Send_Damage").implementation = function(hunted){
        let hits = 1;

        const multiHit = configManager.get('multiHit');
        let roll = Math.floor(Math.random() * 101); // 0 -> 100
        
        if(roll <= multiHit.twoHits) hits = 2;
        if(roll <= multiHit.threeHits) hits = 3;
        if(roll <= multiHit.fiveHits) hits = 5;

        for(let i = 0; i < hits; i++){
            this.method("Send_Damage").invoke(hunted);
        }
    }
    Logger("[+] multiAttack successfully initialized!");
}