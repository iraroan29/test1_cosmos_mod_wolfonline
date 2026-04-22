/// <reference types="frida-gum" />
import Java from 'frida-java-bridge'
import "frida-il2cpp-bridge"; 

Java.perform(() => {
    const URL = Java.use("java.net.URL");
    const Scanner = Java.use("java.util.Scanner");
    const Thread = Java.use("java.lang.Thread");
    const Runnable = Java.use("java.lang.Runnable");
    const Log = Java.use("android.util.Log");
    const TAG = "FRIDA_SCRIPT";

    function fetchRemoteScript(urlStr: string) {
        try {
            const url = URL.$new(urlStr);
            const connection = url.openConnection();
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            const inputStream = connection.getInputStream();
            
            const scanner = Scanner.$new(inputStream, "UTF-8");
            scanner.useDelimiter("\\A");
            const javaString = scanner.hasNext() ? scanner.next() : "";
            scanner.close();
            
            // Force conversion from Java String to JS String
            return javaString.toString();
        } catch (e) {
            Log.v(TAG, "Fetch Error: " + e);
            return null;
        }
    }

    const rawUrl = "https://raw.githubusercontent.com/iraroan29/test1_cosmos_mod_wolfonline/refs/heads/main/dist/RemoteScript.js";
    const githubUrl = rawUrl + "?t=" + Date.now(); 
    const RemoteTask = Java.registerClass({
        name: "com.example.RemoteScriptLoader",
        implements: [Runnable],
        methods: {
            run: function () {
                Log.v(TAG, "Fetching script...");
                const code = fetchRemoteScript(githubUrl);

                if (code) {
                    Log.v(TAG, "Fetched! Size: " + code.length);
                    
                    Script.nextTick(() => {
                        try {
                            // Use Script.evaluate (it's the cleanest Frida API)
                            Script.evaluate("remote-hook.js", code);
                            Log.v(TAG, "Remote script evaluated successfully!");
                        } catch (evalErr) {
                            Log.v(TAG, "Evaluation failed: " + evalErr);
                        }
                    });
                }
            }
        }
    });

    Thread.$new(RemoteTask.$new()).start();
});
