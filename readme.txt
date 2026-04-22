--- Frida listener to check Logger(...) calls
adb logcat -s FRIDA_SCRIPT:* 


--- What I remember or can think of for setup
npx tsc --init
npm install frida-il2cpp-bridge@0.12.0
npm install --save-dev frida-compile
npm install --save-dev @types/frida-gum
npm install --save-dev typescript
