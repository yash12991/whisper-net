/**
 * WhisperNet Cryptography Module
 * Implements Web Crypto API for RSA-OAEP, AES-256-GCM, ECDSA Signatures, PBKDF2 Vault, and Ratchet
 */

// Generate RSA-OAEP 3072-bit Key Pair
export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 3072,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // Extractable (for initial vault encryption)
    ["encrypt", "decrypt"]
  );
}

// Export Public Key to PEM
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  const exportedAsBase64 = btoa(exportedAsString);
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`;
}

// Import Public Key from PEM
export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).trim();
  const binaryDerString = atob(pemContents.replace(/\s+/g, ""));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Export Private Key to JWK string
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

// Import Private Key from JWK string
export async function importPrivateKey(jwkString: string, extractable = true): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    extractable,
    ["decrypt"]
  );
}

// Generate AES-256-GCM Session Key
export async function generateSessionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt Session Key with RSA-OAEP Public Key
export async function encryptSessionKey(sessionKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
  const rawSessionKey = await crypto.subtle.exportKey("raw", sessionKey);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    rawSessionKey
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decrypt Session Key with RSA-OAEP Private Key
export async function decryptSessionKey(encryptedSessionKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> {
  const encryptedSessionKey = Uint8Array.from(atob(encryptedSessionKeyBase64), c => c.charCodeAt(0));
  const rawSessionKey = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedSessionKey
  );
  return await crypto.subtle.importKey(
    "raw",
    rawSessionKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt Message using AES-GCM
export async function encryptMessage(message: string, sessionKey: CryptoKey): Promise<{ ciphertext: string, nonce: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate 96-bit (12 bytes) secure random nonce for AES-GCM
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      tagLength: 128, // 128-bit authentication tag appended
    },
    sessionKey,
    data
  );
  
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const nonceBase64 = btoa(String.fromCharCode(...nonce));
  
  return { ciphertext: ciphertextBase64, nonce: nonceBase64 };
}

// Decrypt Message using AES-GCM
export async function decryptMessage(ciphertextBase64: string, nonceBase64: string, sessionKey: CryptoKey): Promise<string> {
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
  const nonce = Uint8Array.from(atob(nonceBase64), c => c.charCodeAt(0));
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        tagLength: 128,
      },
      sessionKey,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error("Message authentication failed. The message may have been modified.");
  }
}

// ==========================================
// 1. ZERO-KNOWLEDGE ENCRYPTED KEY VAULT (PBKDF2)
// ==========================================

export async function deriveKeyEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 600000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptVaultItem(plaintext: string, kek: CryptoKey): Promise<{ encryptedBlob: string, iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    kek,
    encoder.encode(plaintext)
  );
  return {
    encryptedBlob: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptVaultItem(encryptedBlobBase64: string, ivBase64: string, kek: CryptoKey): Promise<string> {
  const encrypted = Uint8Array.from(atob(encryptedBlobBase64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    kek,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}

// ==========================================
// 2. DIGITAL SIGNATURES (ECDSA P-256)
// ==========================================

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );
}

export async function exportSigningPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  const exportedAsBase64 = btoa(exportedAsString);
  return `-----BEGIN SIGNING PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g)?.join("\n")}\n-----END SIGNING PUBLIC KEY-----`;
}

export async function importSigningPublicKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN SIGNING PUBLIC KEY-----";
  const pemFooter = "-----END SIGNING PUBLIC KEY-----";
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length).trim();
  const binaryDerString = atob(pemContents.replace(/\s+/g, ""));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

export async function signPayload(privateSigningKey: CryptoKey, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateSigningKey,
    encoder.encode(payload)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyPayloadSignature(publicSigningKey: CryptoKey, signatureBase64: string, payload: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    return await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicSigningKey,
      signature,
      encoder.encode(payload)
    );
  } catch (err) {
    return false;
  }
}

// ==========================================
// 3. SAFETY NUMBERS & FINGERPRINT VERIFICATION
// ==========================================

export async function calculateSafetyNumber(keyA: string, keyB: string): Promise<string> {
  const sorted = [keyA.trim(), keyB.trim()].sort();
  const combined = sorted[0] + ":::" + sorted[1];
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(combined));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Format into 12 5-digit segments (60 digits total, like Signal Safety Numbers)
  let numericString = "";
  for (let i = 0; i < 24; i += 2) {
    const val = (hashArray[i] << 8) | hashArray[i + 1];
    const segment = (val % 100000).toString().padStart(5, '0');
    numericString += segment;
  }
  
  // Return formatted blocks: 12345 67890 ...
  return numericString.match(/.{1,5}/g)?.join(" ") || numericString;
}

// ==========================================
// 4. SYMMETRIC RATCHETING STEP (FORWARD SECRECY)
// ==========================================

export async function ratchetSessionKey(currentSessionKey: CryptoKey): Promise<CryptoKey> {
  const rawCurrent = await crypto.subtle.exportKey("raw", currentSessionKey);
  const encoder = new TextEncoder();
  
  // Derive next chain key using HKDF / SHA-256
  const baseKey = await crypto.subtle.importKey("raw", rawCurrent, "HKDF", false, ["deriveKey"]);
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("WhisperNet-Ratchet-Step-Salt") as any,
      info: encoder.encode("WhisperNet-Message-Key-Ratchet") as any,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}
