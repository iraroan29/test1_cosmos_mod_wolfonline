import { configManager } from "../config/ConfigManager";

export function ensureDamageTaken() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC ) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for ensureDamageTaken, retrying...");
        setTimeout(ensureDamageTaken, 500);
        return;
    }
    const AssemblyC = assemblyC.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");

    Player_Wolf.method("Damage").implementation = function (damageAmount) {
        const hp = this.field<number>("hp").value;
        if(hp < 0) {
            this.field<number>("hp").value = 1;
            return this.method("Damage").invoke(damageAmount);
        }

        // Resurrection logic
        const dmgHp = hp - Math.min(4.75, (damageAmount as number));
        const maxHp = this.field<number>("hpmax").value;
        if(dmgHp <= 0){
            let roll = Math.floor(Math.random() * 101); // 0 -> 100
            Logger("[*] Resurrection Roll >> " + roll.toString());
            if(roll <= 100){//configManager.get('deathTierInfo').resurrection){
                // Reset hp to max and don't get damage, sill counts towards death
                configManager.incrementScore('deathScore');
                this.field<number>("hp").value = maxHp;
                return;
            }
        }
        // Didn't get the resurrection roll
        return this.method("Damage").invoke(damageAmount);
    };
    
    Logger("[+] ensureDamageTaken successfully initialized!");
}