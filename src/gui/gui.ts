import "frida-il2cpp-bridge";

export class UnityGUI {
    // ---------------------------------------------------------
    // 0. Predeclare all class references (assigned after checks)
    // ---------------------------------------------------------
    private static UnityCore: Il2Cpp.Image;
    private static IMGUIModule: Il2Cpp.Image; 

    private static GUI: Il2Cpp.Class;
    private static RectClass: Il2Cpp.Class;
    private static ColorClass: Il2Cpp.Class;
    private static ScreenClass: Il2Cpp.Class;

    private static initialized = false;

    // ---------------------------------------------------------
    // 1. Safe initializer — mirrors ModMenuHooks pattern
    // ---------------------------------------------------------
    private static init(): boolean {
        if (this.initialized) return true;

        const coreAsm = Il2Cpp.domain.assembly("UnityEngine.CoreModule");
        const imguiAsm = Il2Cpp.domain.assembly("UnityEngine.IMGUIModule");

        // Safety Check: Ensure modules exist
        if (!coreAsm || !imguiAsm) {
            console.log("[UnityGUI] Modules not ready, retrying...");
            setTimeout(() => this.init(), 500);
            return false;
        }

        this.UnityCore = coreAsm.image;
        this.IMGUIModule = imguiAsm.image;

        // Safety Check: Resolve classes
        this.GUI = this.IMGUIModule.class("UnityEngine.GUI");
        this.RectClass = this.UnityCore.class("UnityEngine.Rect");
        this.ColorClass = this.UnityCore.class("UnityEngine.Color");
        this.ScreenClass = this.UnityCore.class("UnityEngine.Screen");

        if (!this.GUI || !this.RectClass || !this.ColorClass) {
            console.log("[UnityGUI] Classes not ready, retrying...");
            setTimeout(() => this.init(), 500);
            return false;
        }

        this.initialized = true;
        console.log("[UnityGUI] Successfully initialized!");
        return true;
    }

    // ---------------------------------------------------------
    // 2. Safe Rect creation
    // ---------------------------------------------------------
    private static createRect(x: number, y: number, w: number, h: number): Il2Cpp.ValueType {
        if (!this.init()) return null as unknown as Il2Cpp.ValueType;

        try {
            const rect = this.RectClass.new().unbox();
            rect.method("set_x").invoke(x);
            rect.method("set_y").invoke(y);
            rect.method("set_width").invoke(w);
            rect.method("set_height").invoke(h);
            return rect;
        } catch (e) {
            console.log("[UnityGUI] Rect creation failed:", e);
            return null as unknown as Il2Cpp.ValueType;
        }
    }

    // ---------------------------------------------------------
    // 3. Safe Color creation
    // ---------------------------------------------------------
    static createColor(r: number, g: number, b: number, a: number = 1.0): Il2Cpp.ValueType {
        if (!this.init()) return null as unknown as Il2Cpp.ValueType;

        try {
            const color = this.ColorClass.new().unbox();
            color.field("r").value = r;
            color.field("g").value = g;
            color.field("b").value = b;
            color.field("a").value = a;
            return color;
        } catch (e) {
            console.log("[UnityGUI] Color creation failed:", e);
            return null as unknown as Il2Cpp.ValueType;
        }
    }

    // ---------------------------------------------------------
    // 4. UI Controls — wrapped in safety checks
    // ---------------------------------------------------------

    static label(x: number, y: number, w: number, h: number, text: string): void {
        if (!this.init()) return;

        try {
            this.GUI.method("Label")
                .overload("UnityEngine.Rect", "System.String")
                .invoke(this.createRect(x, y, w, h), Il2Cpp.string(text));
        } catch (e) {
            console.log("[UnityGUI] label() failed:", e);
        }
    }

    static button(x: number, y: number, w: number, h: number, text: string): boolean {
        if (!this.init()) return false;

        try {
            return this.GUI.method("Button")
                .overload("UnityEngine.Rect", "System.String")
                .invoke(this.createRect(x, y, w, h), Il2Cpp.string(text)) as boolean;
        } catch (e) {
            console.log("[UnityGUI] button() failed:", e);
            return false;
        }
    }

    static toggle(x: number, y: number, w: number, h: number, state: boolean, text: string): boolean {
        if (!this.init()) return state;

        try {
            return this.GUI.method("Toggle")
                .overload("UnityEngine.Rect", "System.Boolean", "System.String")
                .invoke(this.createRect(x, y, w, h), state, Il2Cpp.string(text)) as boolean;
        } catch (e) {
            console.log("[UnityGUI] toggle() failed:", e);
            return state;
        }
    }

    static slider(x: number, y: number, w: number, h: number, val: number, min: number, max: number): number {
        if (!this.init()) return val;

        try {
            return this.GUI.method("HorizontalSlider")
                .overload("UnityEngine.Rect", "System.Single", "System.Single", "System.Single")
                .invoke(this.createRect(x, y, w, h), val, min, max) as number;
        } catch (e) {
            console.log("[UnityGUI] slider() failed:", e);
            return val;
        }
    }

    static textField(x: number, y: number, w: number, h: number, text: string): string {
        if (!this.init()) return text;

        try {
            const result = this.GUI.method("TextField")
                .overload("UnityEngine.Rect", "System.String")
                .invoke(this.createRect(x, y, w, h), Il2Cpp.string(text)) as Il2Cpp.String;

            return result?.content || "";
        } catch (e) {
            console.log("[UnityGUI] textField() failed:", e);
            return text;
        }
    }

    static box(x: number, y: number, w: number, h: number, title: string = ""): void {
        if (!this.init()) return;

        try {
            this.GUI.method("Box")
                .overload("UnityEngine.Rect", "System.String")
                .invoke(this.createRect(x, y, w, h), Il2Cpp.string(title));
        } catch (e) {
            console.log("[UnityGUI] box() failed:", e);
        }
    }

    static setBackgroundColor(r: number, g: number, b: number, a: number = 1.0): void {
        if (!this.init()) return;

        try {
            this.GUI.method("set_backgroundColor").invoke(this.createColor(r, g, b, a));
        } catch (e) {
            console.log("[UnityGUI] setBackgroundColor() failed:", e);
        }
    }
    /**
     * Returns the current screen width in pixels
     */
    static get width(): number {
        if (!this.init()) return -1;
        return this.ScreenClass.method("get_width").invoke() as number;
    }

    /**
     * Returns the current screen height in pixels
     */
    static get height(): number {
        if (!this.init()) return -1;
        return this.ScreenClass.method("get_height").invoke() as number;
    }

    static convertHexToUnityRich(str: string) {
        // Remove [-]
        str = str.replace(/\[-\]/g, "");

        // Convert [b], [i], [u] → <b>, <i>, <u>
        str = str.replace(/\[b\]/gi, "<b>");
        str = str.replace(/\[i\]/gi, "<i>");
        str = str.replace(/\[u\]/gi, "<u>");

        // Convert [/b], [/i], [/u] → </b>, </i>, </u>
        str = str.replace(/\[\/b\]/gi, "</b>");
        str = str.replace(/\[\/i\]/gi, "</i>");
        str = str.replace(/\[\/u\]/gi, "</u>");

        let output = "";
        let currentColor = null;

        // Match [RRGGBB]
        const regex = /\[([0-9A-Fa-f]{6})\]/g;

        let lastIndex = 0;
        let match;

        while ((match = regex.exec(str)) !== null) {
            const hex = match[1];
            const index = match.index;

            // Append text between previous match and this one
            output += str.substring(lastIndex, index);

            // Close previous color
            if (currentColor !== null) {
                output += "</color>";
            }

            // Open new color
            output += `<color=#${hex}>`;
            currentColor = hex;

            lastIndex = regex.lastIndex;
        }

        // Append remaining text
        output += str.substring(lastIndex);

        // Close final color
        if (currentColor !== null) {
            output += "</color>";
        }

        return output;
    }
}