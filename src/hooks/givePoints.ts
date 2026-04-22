import { configManager } from "../config/ConfigManager";
import { SharedState } from "../helpers/playerWolfStore";

// Temp 
let mod_points = 10000;

// Custom
let cooldownActive = false;
let cooldownEndTime = 0;

// Data Types
let SystemObject: Il2Cpp.Class
let SingleClass: Il2Cpp.Class

// Classes
let GameObject: Il2Cpp.Class
let PhotonView: Il2Cpp.Class
let PlayerWolf: Il2Cpp.Class

// Helpers: Argument Builders
function makeObjectArray(items: Il2Cpp.Object[]): Il2Cpp.Object {
    return Il2Cpp.array(SystemObject, items) as unknown as Il2Cpp.Object;
}
function newSingle(value: number): Il2Cpp.Object {
    const s = SingleClass.new();
    s.field("m_value").value = value;
    return s;
}

// Helpers: checks
function isMe(theAttacked: Il2Cpp.Object): boolean {
    const attackedGO = theAttacked.method<Il2Cpp.Object>("get_gameObject").invoke();

    // NEW RULE: Must match my real player wolf body
    if (SharedState.realBody && !attackedGO.equals(SharedState.realBody)) {
        return false;
    }

    const hasPlayerWolf = attackedGO.method<Il2Cpp.Object>("GetComponent")
        .inflate(PlayerWolf)
        .invoke();
    if (!hasPlayerWolf) return false;

    const attackedTransform = attackedGO
        .method<Il2Cpp.Object>("get_transform")
        .invoke();

    const attackedTransformRoot = attackedTransform
        .method<Il2Cpp.Object>("get_root")
        .invoke();

    const attackedView = attackedTransformRoot
        .method<Il2Cpp.Object>("GetComponent")
        .inflate(PhotonView)
        .invoke();

    return attackedView.method<boolean>("get_isMine").invoke();
}

function isOnCooldown(): boolean {
    if (!cooldownActive) return false;

    const now = Date.now();
    if (now >= cooldownEndTime) {
        cooldownActive = false;
        return false;
    }

    return true;
}



export function givePoints(){
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    const coreAssembly = Il2Cpp.domain.assembly("UnityEngine.CoreModule");
        
    if (!assemblyC || !coreAssembly) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for givePoints, retrying...");
        setTimeout(givePoints, 500);
        return;
    }


    const AssemblyC = assemblyC.image;
    const UnityCore = coreAssembly.image;
    const RPC_Damage = AssemblyC.class("RPC_Damage");
    PhotonView = AssemblyC.class("PhotonView");
    PlayerWolf = AssemblyC.class("Player_Wolf");
    GameObject = UnityCore.class("UnityEngine.GameObject");

    // Define data types
    SystemObject = Il2Cpp.corlib.class("System.Object");
    SingleClass = Il2Cpp.corlib.class("System.Single");


    RPC_Damage.method("Net_Damage").implementation = function(hunter, hunter_id, damage){
        // If this isn't my net_damage function, call the original
        // If points aren't set, call the original
        hunter = hunter as Il2Cpp.Object;
        // hunter == null when npc attacking player
        // isMe == is it my player object
        // mod_points needs to be greater than 0
        // is the cooldown done
        if( !hunter || hunter.isNull() || !isMe(this as Il2Cpp.Object) || mod_points == 0 || isOnCooldown()){
            return this.method("Net_Damage").invoke(hunter, hunter_id, damage);
        }
        cooldownActive = true;
        const COOLDOWN_MS = configManager.get('cooldownMs');
        cooldownEndTime = Date.now() + COOLDOWN_MS;

        const exp = newSingle(mod_points);
        const point = newSingle(mod_points);

        const LastDmgArray = makeObjectArray([
                    exp,
                    point,
                    Il2Cpp.string("Eating") as unknown as Il2Cpp.Object
                ]);
        const receiverView = PhotonView.method<Il2Cpp.Object>("Find").invoke(hunter_id as number);
        const receiver = receiverView.method<Il2Cpp.Object>("get_owner").invoke();
        receiverView.method<void>("RPC")
                .overload("System.String", "PhotonPlayer", "System.Object[]")
                .invoke(Il2Cpp.string("Net_Last_Damage_Hunter"), receiver, LastDmgArray);

        
        // calculate aidscore to increment
        const raw = (mod_points / 10000) * Math.max(2, configManager.get('currentTier'));
        configManager.incrementScore('aidScore', Math.round(raw * 10) / 10);

        // Check if cooldown decreases
        // if(getTierInfo != null){
        //     // If aid is larger than tier threshold
        //     // If pointCooldown isn't already equal to tier point cooldown
        //     // Set size to aidbody size
        //     if(ConfigManager.get('aid') >= getTierInfo().aidThreshold && ConfigManager.get('pointCooldown') != getTierInfo().aidPointCooldown){
        //         Logger(`[*] GivePoint cooldown decreased from ${ConfigManager.get('pointCooldown')} to ${getTierInfo().aidPointCooldown}`)
        //         ConfigManager.set('pointCooldown', getTierInfo().aidPointCooldown);
        //         ConfigManager.set('size', getTierInfo().aidSize);
        //         respawn();
        //     }
        // }

    }
    
    Logger("[+] givePoints successfully initialized!");
}