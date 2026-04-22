// Replacement names
const names = new Map<string, string>([
    ["Hello", "[b][ffea00]H[ffd400]e[ffbe00]l[ffa500]l[ff8a00]o[ff6f00] [ff7c00]W[ff8900]o[ff9200]r[ff9900]l[ffa000]d"],
    ["Goodnight", "[i][ff00cc]G[e200db]o[c500e9]o[a800f8]d[8a00ff]n[6d00ff]i[5000ff]g[3300ff]h[2400f0]t[1600e2] [0700d3]W[0000b6]o[00008a]r[00005f]l[000033]d"]
]);

const SECRET_SYMBOLS = "✪✫✷✧✶✦✬✰✴✭✵✯";


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
        const mInput = this.field("mInput").value as Il2Cpp.Object;
        mInput.field("characterLimit").value = 1000;

        // Check if name has symbols, if not add them
        let ID = mInput.field("mValue").value as Il2Cpp.String;
        // if(!ID.content.includes(SECRET_SYMBOLS)){
        //     (mInput.field<Il2Cpp.String>("mValue").value).content += SECRET_SYMBOLS;
        // }
    }

    // 3. Replace Input ID if they enter specific strings
    InputID.method("OnSubmit").implementation = function(){
        const mInput = this.field("mInput").value as Il2Cpp.Object;
        let ID = mInput.field("mValue").value as Il2Cpp.String;
        
        for( const [searchName, replaceName] of names){
            if(ID.content.toString() === searchName) {
                mInput.field("mValue").value = Il2Cpp.string(replaceName);
                break;
            }
        }

        // Check if name has symbols, if not add them
        // if(!ID.content.includes(SECRET_SYMBOLS)){
        //     (mInput.field<Il2Cpp.String>("mValue").value).content += SECRET_SYMBOLS;
        // }

        // Call original method
        this.method("OnSubmit").invoke();
    }

    
    Logger("[+] inputID successfully initialized!");
}