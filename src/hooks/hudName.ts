
// Helper: Check for hex/formatters in name
// const formatters = ['[sub]', '[/sub]', '[sup]', '[/sup]', '[s]', '[/s]',
//                     '[b]', '[/b]', '[i]', '[/i]', '[u]', '[/u]', '[-]' ];

import { configManager } from "../config/ConfigManager";

// const hexRegex = new RegExp("\\[([0-9A-Fa-f]{6})\\]", "g");

// function useModNameGradient(name) {
//     const hasFormatting = formatters.some(sub => name.includes(sub));

//     const hexMatch = name.match(hexRegex);
//     const hasHexCodes = hexMatch !== null;

//     // If it has formatting OR hex codes, do not use mod gradient
//     return !(hasFormatting || hasHexCodes);
// }

export function hudName() {

    // 1. Check if assemblies exist before proceeding
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const coreAssembly = Il2Cpp.domain.assembly("UnityEngine.CoreModule");

    if (!assemblyC || !coreAssembly) {
        // If not found, wait 500ms and try again
        Logger("[!] hudName Assemblies not ready, retrying in 500ms...");
        setTimeout(hudName, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const UnityCore = coreAssembly.image;
    const ChatParticipant = AssemblyC.class("ChatParticipant");

    ChatParticipant.method("Set_hudText_ADD").implementation = function (ID) {
        const mText = this.field("mText").value as Il2Cpp.Object;
        const removeCE = "[/u][/i][/sup][/sub][/s][/b]";

        const ColorClass = UnityCore.class("UnityEngine.Color");
        const color = ColorClass.new().unbox();

        color.field("r").value = 1.0;
        color.field("g").value = 1.0;
        color.field("b").value = 1.0;
        color.field("a").value = 1.0;

        let userID = (ID as Il2Cpp.String).content;
        // if(useModNameGradient(userID)){
        //     const idState = { index: 0 };
        //     const gradient = multiGradientGen(["327ec5", "5c4d9a", "8d439a", "a557ca", "4621e3", "6673b6"], userID.length + 5);
        //     Logger("Gradient: " + gradient.toString());
        //     userID = applyShiftingGradientText(gradient, userID, idState);
        // }
         
        const displayName = removeCE + configManager.get('tierName') + "[b][ffffff]" + userID + removeCE;
        mText.method<void>("Add").invoke(
            Il2Cpp.string(`${displayName}`),
            color,
            86400
        );
    };
    
    Logger("[+] hudName successfully initialized!");
}