import { configManager } from "../config/ConfigManager";
import { UnityGUI } from "./gui";

let GUIMatrixClass: Il2Cpp.Class;
let Matrix4x4Class: Il2Cpp.Class;
let Vector3Class: Il2Cpp.Class;

export function configDisplay(){
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const imgui = Il2Cpp.domain.assembly("UnityEngine.IMGUIModule");
    const core = Il2Cpp.domain.assembly("UnityEngine.CoreModule");

    // 2. Safety Check: Ensure ALL required modules are loaded
    if (!assemblyC || !imgui || !core) {
        Logger("[!] Modules not ready for configDisplay, retrying...");
        setTimeout(configDisplay, 500);
        return;
    }
    
    const AssemblyC = assemblyC.image;
    const UnityCoreImage = core.image;
    const MasterJoinClass = AssemblyC.class("Master_Join");
    GUIMatrixClass = imgui.image.class("UnityEngine.GUI"); // They are the same class
    Matrix4x4Class = UnityCoreImage.class("UnityEngine.Matrix4x4");
    Vector3Class = UnityCoreImage.class("UnityEngine.Vector3");

    const screenWidth = UnityGUI.width;
    const finalScale = 1.7 * (screenWidth / 2560);
    const scaledWidth = screenWidth / finalScale;

    // Apply Mod Name Scaling
    const bigMult = 2;
    const vecBig = Vector3Class.alloc().unbox();
    vecBig.field("x").value = finalScale * bigMult;
    vecBig.field("y").value = finalScale * bigMult;
    vecBig.field("z").value = 1.0;
    const matrixBig = Matrix4x4Class.method("Scale").invoke(vecBig) as Il2Cpp.Object;

    // Mod Name at very top of screen
    const xModName = ((scaledWidth / bigMult) / 2) - (220 / 2);
    const yModName = 4;
    const modNameGradient = UnityGUI.convertHexToUnityRich("[b][3798e5]C[4198dc]o[4c97d4]s[5697cb]m[5a90cd]o[5d89d0]s [647cd2]M[6676d2]o[6970d2]d [6a61d1]b[6a59d1]y [6e4ace]A[7245cb]p[773fc9]r[8445d0]i[914cd6]c[9e52dd]i[aa57de]t[b65bdf]y [ce64e1][[be66d1]9[ad68c0].[9d6ab0]0[91709e].[86768d]4[7a7c7b]]");
        
    
    MasterJoinClass.method("OnGUI").implementation = function(){
        // Call original method
        this.method("OnGUI").invoke();

    
        GUIMatrixClass.method("set_matrix").invoke(matrixBig);
        UnityGUI.label(xModName, yModName, 220, 60, modNameGradient);

        UnityGUI.label(xModName, 20, 100, 50, "HONOR: " + configManager.get('honorScore').toFixed(2));
        UnityGUI.label(xModName + 220 - 100, 20, 100, 50, "AID: " + configManager.get('aidScore').toFixed(1));
    }
    
    Logger("[+] configDisplay successfully initialized!");
}