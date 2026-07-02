// Cryptographic Utilities for Secure Authentication
// Powered by browser native Web Cryptography API

// Helper: Convert Hex String to Uint8Array
export function hexToBytes(hexString) {
    if (!hexString) return new Uint8Array(0);
    const matches = hexString.match(/.{1,2}/g);
    if (!matches) return new Uint8Array(0);
    return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Helper: Convert Uint8Array to Hex String
export function bytesToHex(byteArray) {
    return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate a Cryptographically Secure Random Salt (16 bytes = 32 hex characters)
export function generateSalt() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return bytesToHex(array);
}

// Convert a plaintext password into a CryptoKey for PBKDF2
async function getPasswordKey(password) {
    const enc = new TextEncoder();
    return window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );
}

/**
 * Hash a password using PBKDF2 with HMAC-SHA-256
 * @param {string} password Plaintext password
 * @param {string} saltHex Salt in hex representation
 * @param {number} iterations Iteration count (default 100,000)
 * @returns {Promise<string>} Hex representation of the derived hash (32 bytes / 64 characters)
 */
export async function hashPassword(password, saltHex, iterations = 100000) {
    try {
        const passwordKey = await getPasswordKey(password);
        const saltBytes = hexToBytes(saltHex);
        
        const derivedBits = await window.crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: saltBytes,
                iterations: iterations,
                hash: "SHA-256"
            },
            passwordKey,
            256 // 256 bits = 32 bytes
        );
        
        return bytesToHex(new Uint8Array(derivedBits));
    } catch (e) {
        console.error("Cryptographic derivation failed: ", e);
        throw e;
    }
}

// Generate a mock secure session token (SHA-256 of random bytes)
export async function generateSessionToken() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", array);
    return bytesToHex(new Uint8Array(hashBuffer));
}
