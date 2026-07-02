// Security Lab Interactive Hashing Visualizer
import { hashPassword, generateSalt } from './crypto.js';

export async function runHashComparison(password, saltHex, iterations = 100000) {
    if (!password) {
        return {
            sha256Hash: '',
            sha256TimeMs: 0,
            pbkdf2Hash: '',
            pbkdf2TimeMs: 0
        };
    }

    // 1. Calculate Simple SHA-256 (for comparison)
    const t0 = performance.now();
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const sha256Hash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
    const t1 = performance.now();
    const sha256TimeMs = (t1 - t0);

    // 2. Calculate PBKDF2 Hashing (Key stretching)
    const t2 = performance.now();
    const pbkdf2Hash = await hashPassword(password, saltHex, iterations);
    const t3 = performance.now();
    const pbkdf2TimeMs = (t3 - t2);

    return {
        sha256Hash,
        sha256TimeMs: sha256TimeMs.toFixed(4),
        pbkdf2Hash,
        pbkdf2TimeMs: pbkdf2TimeMs.toFixed(2)
    };
}
