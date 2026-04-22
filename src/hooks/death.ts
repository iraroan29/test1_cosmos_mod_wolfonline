import { configManager } from "../config/ConfigManager";

export function deathCounter() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for deathCounter, retrying...");
        setTimeout(deathCounter, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const RPC_Damage = AssemblyC.class("RPC_Damage");
    RPC_Damage.method("Last_Damage").implementation = function(){
        configManager.incrementScore('deathScore')
        configManager.decrementScore('honorScore', configManager.get('deathTierInfo').honorReduction);
        return this.method("Last_Damage").invoke();
    }
    Logger("[+] deathCounter successfully initialized!");
}