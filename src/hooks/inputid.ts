// Replacement names
const names = new Map<string, string>([
    ["Hello", "[b][ffea00]H[ffd400]e[ffbe00]l[ffa500]l[ff8a00]o[ff6f00] [ff7c00]W[ff8900]o[ff9200]r[ff9900]l[ffa000]d"],
    ["Goodnight", "[i][ff00cc]G[e200db]o[c500e9]o[a800f8]d[8a00ff]n[6d00ff]i[5000ff]g[3300ff]h[2400f0]t[1600e2] [0700d3]W[0000b6]o[00008a]r[00005f]l[000033]d"]
]);

let INPUT: Il2Cpp.Object = null;
export function updateID(name: string) {
    if (!INPUT.isNull()) {
        const mInput = INPUT.field("mInput").value as Il2Cpp.Object;
        
        // 1. Update the value
        mInput.field("mValue").value = Il2Cpp.string(name);

        // 2. Force the UI to refresh its text display
        // Note: Check if the method name is "UpdateLabel" or "ExecuteOnValueChange"
        const updateLabel = INPUT.field("input_label").value as Il2Cpp.Object;
        updateLabel.method("SetText").invoke(Il2Cpp.string(name));

        // 3. Trigger the logic submission
        INPUT.method("OnSubmit").invoke();

        Logger(`Input ID visually updated to: ${name}`);
    }
}



export function inputID(){
    
    const assemblyC = Il2Cpp.domain.assembly("Assembly-CSharp");
    
    if (!assemblyC) {
        // If not found, wait 500ms and try again
        Logger("[!] Assembly-CSharp not ready for inputID, retrying...");
        setTimeout(inputID, 500);
        return;
    }

    const AssemblyC = assemblyC.image;
    const InputID = AssemblyC.class("Input_ID");

    // 2. Increase character limit
    InputID.method("Start").implementation = function(){
        // Call original method
        this.method("Start").invoke();
        // Store this instance of Input_ID
        INPUT = this as Il2Cpp.Object;

        const mInput = this.field("mInput").value as Il2Cpp.Object;
        mInput.field("characterLimit").value = 1000;
    }

    // 3. Replace Input ID if they enter specific strings
    InputID.method("OnSubmit").implementation = function(){
        Logger("IS IT SUBMITTING???S?GJ")
        const mInput = this.field("mInput").value as Il2Cpp.Object;
        let ID = mInput.field("mValue").value as Il2Cpp.String;
        
        for( const [searchName, replaceName] of names){
            if(ID.content.toString() === searchName) {
                mInput.field("mValue").value = Il2Cpp.string(replaceName);
                break;
            }
        }

        // Call original method
        this.method("OnSubmit").invoke();
    }

    
    Logger("[+] inputID successfully initialized!");
}