import { configManager } from "../config/ConfigManager";

export function honorAttackTesting() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const coreAssembly = Il2Cpp.domain.assembly("UnityEngine.CoreModule");
    
    if (!assemblyC || !coreAssembly) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for honorAttackTesting, retrying...");
        setTimeout(honorAttackTesting, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");

    Player_Wolf.method("AttackON").implementation = function () {
        configManager.incrementScore('honorScore', 10);
        // if(getTierInfo()){
        //     const configTier = ConfigManager.get('tier')
        //     if(configTier < 6 && getTierInfo().num !== configTier){
        //         ConfigManager.increment('tier');
        //         ConfigManager.set('size', getTierInfo().size);
        //         respawn();
        //     }
        // }
        this.method("AttackON").invoke();
    };
    
    Logger("[+] honorAttackTesting successfully initialized!");
}