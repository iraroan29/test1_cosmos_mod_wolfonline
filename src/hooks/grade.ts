import { getCurrentFrame } from "../helpers/animatedGrades";

export function setGrade(){
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for deathCounter, retrying...");
        setTimeout(setGrade, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const ChatParticipant = AssemblyC.class("ChatParticipant");

    ChatParticipant.method("Set_hudText_Grade").implementation = function (this, _Grade) {
        const gradeText = getCurrentFrame().toString().replaceAll('"', "");
        this.method<void>("Set_hudText_Grade").invoke(Il2Cpp.string(gradeText));
    };
}

// ---------------------------------------------------------
// Hook: HUDText_Parent_Check.IsValidString()
// ---------------------------------------------------------

export function gradeValidation() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for deathCounter, retrying...");
        setTimeout(gradeValidation, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const HUDCheckClass = AssemblyC.class("HUDText_Parent_Check");

    HUDCheckClass.method<boolean>("IsValidString").implementation = function ( input ) {
        return true;
    };
}