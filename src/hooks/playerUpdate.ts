import { configManager } from "../config/ConfigManager";

export function playerUpdate() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for playerUpdate, retrying...");
        setTimeout(playerUpdate, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");
    Player_Wolf.method("Update").implementation = function(){
        this.field("body_size").value = configManager.get('size');
        this.field("eat_spped").value = 100;
        // TEMP SPEED HACK
        this.field("runSpeed").value = 100;
        return this.method("Update").invoke();
    }

    Logger("[+] playerUpdate successfully initialized!");
}