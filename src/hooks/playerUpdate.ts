import { configManager } from "../config/ConfigManager";
import { getCurrentInterval } from "../helpers/animatedGrades";

export function playerUpdate() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const coreModule = Il2Cpp.domain.assembly("UnityEngine.CoreModule");
    
    if (!assemblyC || !coreModule) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for playerUpdate, retrying...");
        setTimeout(playerUpdate, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const CoreModule = coreModule.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");
    const ChatParticipant = AssemblyC.class("ChatParticipant");
    const Time = CoreModule.class("UnityEngine.Time");

    
    let gradeTimer = 0;

    Player_Wolf.method("Update").implementation = function(){
        this.field("body_size").value = configManager.get('size');
        this.field("eat_spped").value = 100;
        // <----TEMP SPEED HACK ---->
        this.field("runSpeed").value = 100;

        // HUD grade update
        // Add deltaTime to the timer
        const me = this.method<Il2Cpp.Object>("get_gameObject").invoke();
        const dt = Time.method<number>("get_deltaTime").invoke();
        gradeTimer += dt;

        if (gradeTimer >= getCurrentInterval()) {
            gradeTimer = 0;

            const chatPart = me
                .method<Il2Cpp.Object>("GetComponentInChildren")
                .inflate(ChatParticipant)
                .invoke();

            if (chatPart) {
                chatPart.method<void>("Set_hudText_Grade").invoke(Il2Cpp.string("Lv13"));
            }
        }

        return this.method("Update").invoke();
    }


    Logger("[+] playerUpdate successfully initialized!");
}