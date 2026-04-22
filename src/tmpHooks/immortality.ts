export function immortalTesting() {
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for immortalTesting, retrying...");
        setTimeout(immortalTesting, 500);
        return;
    }
    
    const AssemblyC = assemblyC.image;
    const Player_Wolf = AssemblyC.class("Player_Wolf");

    Player_Wolf.method("Damage").implementation = function (damageAmount) {
        // Log to confirm it's working in logcat
        // console.log("Damage blocked!");
        
        // Simply return to stop the damage logic from executing
        return;
    };
    
    Logger("[+] immortalTesting successfully initialized!");
}