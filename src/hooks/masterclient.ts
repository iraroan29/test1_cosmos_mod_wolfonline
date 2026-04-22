export function stealMasterClient(){
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for stealMasterClient, retrying...");
        setTimeout(stealMasterClient, 500);
        return;
    }
    
    const AssemblyC = assemblyC.image;
    const PhotonNetwork = AssemblyC.class("PhotonNetwork");

    PhotonNetwork.method("SetMasterClient").implementation = function(otherPlayer){
        const playerID = this.method<Il2Cpp.Object>("get_player").invoke().method<number>("get_ID").invoke();
        this.field<Il2Cpp.Object>("networkingPeer").value.method<boolean>("SetMasterClient").invoke(playerID, true);
        // this.method("SetMasterClient").invoke();
    }

    
    Logger("[+] stealMasterClient successfully initialized!");
}