import { configManager } from "../config/ConfigManager";

let cooldownActive = false;
let cooldownEndTime = 0;
const COOLDOWN_DURATION = 30000; // 30 seconds

export function honorAndPointLimiter() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for honorAndPointLimiter, retrying...");
        setTimeout(honorAndPointLimiter, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const RPC_Damage = AssemblyC.class("RPC_Damage");
    RPC_Damage.method("Net_Last_Damage_Hunter").implementation = function(points, exp, tag){

        // --- 1. Update cooldown state
        if (cooldownActive && Date.now() >= cooldownEndTime) {
            cooldownActive = false;
        }
        // --- 2. Clamp the value 
        const incoming = points as number;
        const clamped = Math.min(incoming, 10000);
        // --- 3. If clamped == 10000 && cooldown active
        if (cooldownActive && clamped == 10000){
            // Block points
            return;
        }
        // --- 4. If clamped == 10000 and cooldown not active
        if (!cooldownActive && clamped == 10000){
            cooldownActive = true;
            cooldownEndTime = Date.now() + COOLDOWN_DURATION;
        }

        // HONOR CALCULATIONS
        const tagString = tag.toString().trim();
        if(tagString.includes("Escape")){
            configManager.incrementScore('honorScore', 50); //0.50 Testing
            configManager.incrementKillCount('weakAnimal');
        }
        // Whatever Defense is? // 3.0
        if(tagString.includes("Defense")){
            configManager.incrementScore('honorScore', 1.0);
            configManager.incrementKillCount('defenseAnimal');
        }
        if(tagString.includes("Attack")){
            configManager.incrementScore('honorScore', 1.5);
            configManager.incrementKillCount('attackAnimal');
        }
        if(tagString.includes("Player")){

            configManager.incrementScore('honorScore', 3);
            configManager.incrementKillCount('player');
        }
        if(tagString.includes("Eat")){
            configManager.incrementScore('honorScore', 0.05);
            configManager.incrementKillCount('eat')
        }



        // --- 5. Add points normally
        return this.method("Net_Last_Damage_Hunter").invoke(points, exp, tag);
    }
    Logger("[+] honorAndPointLimiter successfully initialized!");
}