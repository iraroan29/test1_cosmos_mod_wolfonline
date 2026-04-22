// /src/helpers/ConfigHelper.ts

import Java from 'frida-java-bridge';

export class ConfigHelper {
  private static SECRET_KEY = "A1B2C3D4E5F6";

  // === FILE HELPERS ===
  private static JavaFile = Java.use("java.io.File");
  private static FileInputStream = Java.use("java.io.FileInputStream");
  private static FileOutputStream = Java.use("java.io.FileOutputStream");
  private static Scanner = Java.use("java.util.Scanner");
  private static Pattern = Java.use("java.util.regex.Pattern");

  public static exists(path: string): boolean {
    return this.JavaFile.$new(path).exists();
  }

  public static readAllText(path: string): string {
    const f = this.JavaFile.$new(path);
    const fis = this.FileInputStream.$new(f);
    const scanner = this.Scanner.$new(fis).useDelimiter(this.Pattern.compile("\\A"));
    const text = scanner.hasNext() ? scanner.next() : "";
    scanner.close();
    fis.close();
    return text;
  }

  public static writeAllText(path: string, data: string) {
    const f = this.JavaFile.$new(path);
    const fos = this.FileOutputStream.$new(f);
    const bytes = Java.array('byte', Array.from(data).map(c => c.charCodeAt(0)));
    fos.write(bytes);
    fos.close();
  }

  // === CRYPTO ===
  public static crypt(data: string): string {
    let result = "";
    const key = this.SECRET_KEY;
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  // === BASE64 ===
  public static btoa(input: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input;
    let output = '';

    for (let block = 0, charCode, i = 0, map = chars;
      str.charAt(i | 0) || (map = '=', i % 1);
      output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

      charCode = str.charCodeAt(i += 3 / 4);
      if (charCode > 0xFF) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  }

  private static ATOB_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  public static atob(input: any): string {
    const str = String(input);
    let output = "";
    let bc = 0;
    let bs = 0;
    let buffer: number;
    let i = 0;

    while (true) {
      if (i >= str.length) break;

      const ch = str.charAt(i++);
      if (ch === "=") break;

      buffer = this.ATOB_CHARS.indexOf(ch);
      if (buffer === -1) continue;

      bs = bc % 4 ? (bs * 64 + buffer) : buffer;

      if (bc++ % 4) {
        const charCode = (bs >> ((-2 * bc) & 6)) & 255;
        output += String.fromCharCode(charCode);
      }
    }
    return output;
  }
}