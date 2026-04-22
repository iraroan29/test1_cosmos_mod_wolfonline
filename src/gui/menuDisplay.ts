// import { configManager } from "../config/ConfigManager";
// import { UnityGUI } from "./gui";

// // Move variable declarations to top, but don't assign them yet
// let guiEnabled = true;
// let GUIClass: Il2Cpp.Class;
// let GUIMatrixClass: Il2Cpp.Class;
// let Matrix4x4Class: Il2Cpp.Class;
// let Vector3Class: Il2Cpp.Class;
// let isMenuShown: boolean = false;
// let chatFilterFlag: boolean = false;
// const avgWidth = 150;
// const avgHeight = 50;

// // Menu items that reset everytime you join
// export let mod_points: number = 0


// function drawMenu() {
//     // 1. Check if GUI is actually enabled in-game
//     const currentEnabled = GUIClass.method("get_enabled").invoke() as boolean;
//     if (guiEnabled !== currentEnabled) {
//         guiEnabled = currentEnabled;
//     }

//     const screenWidth = UnityGUI.width;
//     const finalScale = 1.7 * (screenWidth / 2560);

//     // Force GUI enabled for our menu
//     GUIClass.method("set_enabled").invoke(true);


//     // Apply Normal Scaling
//     const vec = Vector3Class.alloc().unbox();
//     vec.field("x").value = finalScale;
//     vec.field("y").value = finalScale;
//     vec.field("z").value = 1.0;
//     const matrix = Matrix4x4Class.method("Scale").invoke(vec) as Il2Cpp.Object;
//     GUIMatrixClass.method("set_matrix").invoke(matrix);

//     isMenuShown = UnityGUI.toggle(50, 160, 100, 50, isMenuShown, isMenuShown ? "   Menu: ON" : "   Menu: OFF");
//     if(isMenuShown){
//         // UnityGUI.setBackgroundColor(0.757, 0.259, 0.91, 0.5);
//         // UnityGUI.box(50,200,400,500, "Mod Menu");

//         // drawChatFilterMenu(50 + 10, 200);

//         UnityGUI.label(100, 200, 100, 50, "Points" + mod_points.toString()); 
//         const rawPoints = UnityGUI.slider(100 + 100, 200, 200, 50, mod_points, 0, 10000)
//         mod_points = (Math.round(rawPoints / 1000 /* intervals of 1000*/) * 1000)

        

//         // if (UnityGUI.button(80, 240, avgWidth, avgHeight, "Open Html Website")) {
//         //     const targetUrl = Il2Cpp.string("https://wolfonline.tiiny.site");
//         //     ApplicationClass.method("OpenURL").invoke(targetUrl);
//         // }
//     }

// }
// // TODO: use new chat filter config

// function drawChatFilterMenu(baseX: number, baseY: number){
//     chatFilterFlag = UnityGUI.toggle(baseX, baseY + 20, 200, 50, chatFilterFlag, "   Chat Filtering");
//     const chatFilter = configManager.get('chatFilter');
//     if(chatFilterFlag){
//         UnityGUI.label(baseX + 20, baseY + 40, 360, 80, `<b>${ConfigManager.getChatFilter('timeout') / 1000}</b> second timeout applied when someone sends <b>${ConfigManager.getChatFilter('maxMessages')}</b> messages within <b>${ConfigManager.getChatFilter('timeFrame') / 1000}</b> seconds.\nOr block messages over <b>${ConfigManager.getChatFilter('maxCharacters')}</b> characters.`);
        
//         // Timeout
//         UnityGUI.label(baseX + 20, baseY + 120, avgWidth, 40, "Timeout"); 
//         const rawTimeOut = UnityGUI.slider(baseX + avgWidth, baseY + 120, avgWidth, 40, ConfigManager.getChatFilter('timeout'), 5000, 60000);
//         if(ConfigManager.getChatFilter('timeout') !== (Math.round(rawTimeOut / 500 /* 0.5s */) * 500))
//             ConfigManager.setChatFilter('timeout', Math.round(rawTimeOut / 500 /* 0.5s */) * 500);

//         // Max Messages
//         UnityGUI.label(baseX + 20, baseY + 200, avgWidth, 40, "Max Messages"); 
//         const rawMaxMsgs = UnityGUI.slider(baseX + avgWidth, baseY + avgWidth, 200, 40, ConfigManager.getChatFilter('maxMessages'), 2, 10);
//         if(ConfigManager.getChatFilter('maxMessages') !== Math.round(rawMaxMsgs))
//             ConfigManager.setChatFilter('maxMessages', Math.round(rawMaxMsgs));

//         // Time Frame
//         UnityGUI.label(baseX + 20, baseY + 280, avgWidth, 40, "Time Frame"); 
//         const rawTimeFrame = UnityGUI.slider(baseX + avgWidth, baseY + 280, avgWidth, 40, ConfigManager.getChatFilter('timeFrame'), 1000, 10000);
//         if(ConfigManager.getChatFilter('timeFrame') !== (Math.round(rawTimeFrame / 500 /* 0.5s */) * 500))
//             ConfigManager.setChatFilter('timeFrame', Math.round(rawTimeFrame / 500 /* 0.5s */) * 500);

//         // Max Characters
//         UnityGUI.label(baseX + 20, baseY + 360, avgWidth, 40, "Max Characters"); 
//         const rawMaxChars = UnityGUI.slider(baseX + avgWidth, baseY + 360, avgWidth, 40, ConfigManager.getChatFilter('maxCharacters'), 100, 500);
//         if(ConfigManager.getChatFilter('maxCharacters') !== Math.round(rawMaxChars / 50 /* 0.5s */) * 50)
//             ConfigManager.setChatFilter('maxCharacters', Math.round(rawMaxChars / 50 /* 0.5s */) * 50);
//     }
// }







// export function ModMenuHooks() {
//     const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
//     const imgui = Il2Cpp.domain.assembly("UnityEngine.IMGUIModule");
//     const core = Il2Cpp.domain.assembly("UnityEngine.CoreModule");

//     // 2. Safety Check: Ensure ALL required modules are loaded
//     if (!assemblyC || !imgui || !core) {
//         console.log("[!] Modules not ready for ModMenu, retrying...");
//         setTimeout(ModMenuHooks, 500);
//         return;
//     }

//     // 3. Resolve Classes inside the hook setup
//     GUIClass = imgui.image.class("UnityEngine.GUI");
//     GUIMatrixClass = GUIClass; // They are the same class
    
//     const UnityCoreImage = core.image;
//     Matrix4x4Class = UnityCoreImage.class("UnityEngine.Matrix4x4");
//     Vector3Class = UnityCoreImage.class("UnityEngine.Vector3");

//     const CharacterHUD = assemblyC.image.class("CharacterHUD");

//     CharacterHUD.method("OnGUI").implementation = function() {
//         // Call original method
//         this.method("OnGUI").invoke();
        
//         // Wrap drawMenu in a simple check to prevent crashes if Matrix fails
//         drawMenu();
//     };

//     console.log("[+] ModMenuHooks successfully initialized!");
// }