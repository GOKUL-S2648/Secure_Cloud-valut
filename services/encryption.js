/**
 * Encryption Service using Web Crypto API (AES-GCM 256)
 */

const ALGO = 'AES-GCM';
const KEY_LEN = 256;

/**
 * Derives a cryptographic key from an 8-character string
 */
async function deriveKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('cloudvault-salt'), // Constant salt for simplicity
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: ALGO, length: KEY_LEN },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a File or Blob
 * Returns: { cipherText: ArrayBuffer, iv: Uint8Array }
 */
export async function encryptFile(file, password) {
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await file.arrayBuffer();

    const cipherText = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        data
    );

    return { cipherText, iv };
}

/**
 * Decrypts an ArrayBuffer
 * Returns: Blob
 */
export async function decryptFile(cipherText, iv, password, fileType) {
    const key = await deriveKey(password);

    const decryptedData = await crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        cipherText
    );

    return new Blob([decryptedData], { type: fileType });
}

/**
 * Helper to convert ArrayBuffer/Uint8Array to Base64 (for transmission/storage)
 */
export function bufferToBase64(buf) {
    const binstr = Array.from(new Uint8Array(buf))
        .map(b => String.fromCharCode(b))
        .join('');
    return btoa(binstr);
}

/**
 * Helper to convert Base64 to ArrayBuffer
 */
export function base64ToBuffer(base64) {
    const binstr = atob(base64);
    const buf = new Uint8Array(binstr.length);
    for (let i = 0; i < binstr.length; i++) {
        buf[i] = binstr.charCodeAt(i);
    }
    return buf.buffer;
}
