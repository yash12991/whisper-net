"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  generateRSAKeyPair, 
  exportPublicKey, 
  importPublicKey, 
  exportPrivateKey, 
  importPrivateKey,
  deriveKeyEncryptionKey,
  encryptVaultItem,
  decryptVaultItem,
  generateSigningKeyPair,
  exportSigningPublicKey,
  importSigningPublicKey
} from '@securechat/crypto';
import { saveKeysToVault, getKeysFromVault, clearVaultKeys } from '@/lib/idbKeyStore';

export interface User {
  id: string;
  username: string;
  email: string;
  publicKey: string;
  signingPublicKey?: string;
  encryptedPrivateKey?: string;
  keySalt?: string;
  keyIv?: string;
  encryptedSigningKey?: string;
  signingKeyIv?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  getPrivateKey: () => Promise<CryptoKey | null>;
  getSigningPrivateKey: () => Promise<CryptoKey | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { API_URL } from '@/lib/config';

axios.defaults.withCredentials = true;
axios.defaults.timeout = 8000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [signingPrivateKey, setSigningPrivateKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      const userObj: User | null = res.data.user;
      
      if (!userObj) {
        setUser(null);
        setPrivateKey(null);
        setSigningPrivateKey(null);
        return;
      }
      
      setUser(userObj);
      
      // 1. Try reading from secure IndexedDB vault
      const idbKeys = await getKeysFromVault(userObj.id);
      if (idbKeys?.privateKeyJwk) {
        try {
          const key = await importPrivateKey(idbKeys.privateKeyJwk);
          setPrivateKey(key);
          if (idbKeys.signingPrivateKeyJwk) {
            const jwk = JSON.parse(idbKeys.signingPrivateKeyJwk);
            const signKey = await crypto.subtle.importKey(
              "jwk",
              jwk,
              { name: "ECDSA", namedCurve: "P-256" },
              true,
              ["sign"]
            );
            setSigningPrivateKey(signKey);
          }
          return;
        } catch (e) {
          console.warn("Failed to load keys from IndexedDB, trying legacy fallback", e);
        }
      }

      // 2. Legacy fallback from localStorage (auto-migrates to IndexedDB)
      const storedKey = localStorage.getItem(`securechat_private_key_${userObj.id}`);
      if (storedKey) {
        try {
          const key = await importPrivateKey(storedKey);
          setPrivateKey(key);
          await saveKeysToVault(userObj.id, storedKey);
          localStorage.removeItem(`securechat_private_key_${userObj.id}`);
        } catch (e) {
          console.error("Failed to restore legacy key", e);
        }
      }
    } catch (error) {
      setUser(null);
      setPrivateKey(null);
      setSigningPrivateKey(null);
    } finally {
      setLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const userObj: User = res.data.user;
    setUser(userObj);
    
    // 1. Check local IndexedDB vault first
    const idbKeys = await getKeysFromVault(userObj.id);
    if (idbKeys?.privateKeyJwk) {
      try {
        const key = await importPrivateKey(idbKeys.privateKeyJwk);
        setPrivateKey(key);
        if (idbKeys.signingPrivateKeyJwk) {
          const jwk = JSON.parse(idbKeys.signingPrivateKeyJwk);
          const signKey = await crypto.subtle.importKey(
            "jwk",
            jwk,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign"]
          );
          setSigningPrivateKey(signKey);
        }
        return;
      } catch (e) {
        console.warn("Local IndexedDB key corrupted, falling back to Zero-Knowledge Vault");
      }
    }

    // 2. ZERO-KNOWLEDGE KEY VAULT: Decrypt private keys using password + salt from server
    if (userObj.encryptedPrivateKey && userObj.keySalt && userObj.keyIv) {
      try {
        const salt = Uint8Array.from(atob(userObj.keySalt), c => c.charCodeAt(0));
        const kek = await deriveKeyEncryptionKey(password, salt);
        
        // Decrypt RSA-3072 private key
        const decryptedPrivJwk = await decryptVaultItem(userObj.encryptedPrivateKey, userObj.keyIv, kek);
        const importedRsaKey = await importPrivateKey(decryptedPrivJwk);
        setPrivateKey(importedRsaKey);

        // Decrypt ECDSA signing key if present
        let decryptedSignJwk: string | undefined = undefined;
        if (userObj.encryptedSigningKey && userObj.signingKeyIv) {
          decryptedSignJwk = await decryptVaultItem(userObj.encryptedSigningKey, userObj.signingKeyIv, kek);
          const signJwk = JSON.parse(decryptedSignJwk);
          const signKey = await crypto.subtle.importKey(
            "jwk",
            signJwk,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["sign"]
          );
          setSigningPrivateKey(signKey);
        }

        // Cache in IndexedDB for the active session
        await saveKeysToVault(userObj.id, decryptedPrivJwk, decryptedSignJwk);
        console.log("✅ Zero-Knowledge Key Vault restored private key across device");
        return;
      } catch (err) {
        console.error("Failed to decrypt Zero-Knowledge Key Vault:", err);
      }
    }

    // 3. Fallback for legacy accounts without vault: Initialize vault keys now
    console.warn("Initializing Zero-Knowledge Key Vault for account...");
    const keyPair = await generateRSAKeyPair();
    const signingPair = await generateSigningKeyPair();
    
    setPrivateKey(keyPair.privateKey);
    setSigningPrivateKey(signingPair.privateKey);

    const exportedPriv = await exportPrivateKey(keyPair.privateKey);
    const exportedSignPriv = JSON.stringify(await crypto.subtle.exportKey("jwk", signingPair.privateKey));
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kek = await deriveKeyEncryptionKey(password, salt);
    
    const encPriv = await encryptVaultItem(exportedPriv, kek);
    const encSign = await encryptVaultItem(exportedSignPriv, kek);
    
    const publicKeyPem = await exportPublicKey(keyPair.publicKey);
    const signingPublicKeyPem = await exportSigningPublicKey(signingPair.publicKey);

    await saveKeysToVault(userObj.id, exportedPriv, exportedSignPriv);

    const updateRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      publicKey: publicKeyPem,
      encryptedPrivateKey: encPriv.encryptedBlob,
      keySalt: btoa(String.fromCharCode(...salt)),
      keyIv: encPriv.iv,
      signingPublicKey: signingPublicKeyPem,
      encryptedSigningKey: encSign.encryptedBlob,
      signingKeyIv: encSign.iv,
    });
    setUser(updateRes.data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    // 1. Generate RSA-3072 encryption keypair
    const keyPair = await generateRSAKeyPair();
    const publicKeyPem = await exportPublicKey(keyPair.publicKey);
    const exportedPriv = await exportPrivateKey(keyPair.privateKey);

    // 2. Generate ECDSA P-256 digital signature keypair
    const signingPair = await generateSigningKeyPair();
    const signingPublicKeyPem = await exportSigningPublicKey(signingPair.publicKey);
    const exportedSignPriv = JSON.stringify(await crypto.subtle.exportKey("jwk", signingPair.privateKey));

    // 3. Derive KEK via PBKDF2 (600,000 rounds) and encrypt private keys
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kek = await deriveKeyEncryptionKey(password, salt);
    const encPriv = await encryptVaultItem(exportedPriv, kek);
    const encSign = await encryptVaultItem(exportedSignPriv, kek);

    // Set keys in browser memory
    setPrivateKey(keyPair.privateKey);
    setSigningPrivateKey(signingPair.privateKey);

    // Send encrypted vault bundle to server (Server never receives plaintext keys)
    const res = await axios.post(`${API_URL}/auth/register`, {
      username,
      email,
      password,
      publicKey: publicKeyPem,
      encryptedPrivateKey: encPriv.encryptedBlob,
      keySalt: btoa(String.fromCharCode(...salt)),
      keyIv: encPriv.iv,
      signingPublicKey: signingPublicKeyPem,
      encryptedSigningKey: encSign.encryptedBlob,
      signingKeyIv: encSign.iv,
    });
    
    const userObj = res.data.user;
    
    // Store in IndexedDB vault
    await saveKeysToVault(userObj.id, exportedPriv, exportedSignPriv);
    setUser(userObj);
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (e) {
      console.warn('Logout request failed', e);
    }
    
    setUser(null);
    setPrivateKey(null);
    setSigningPrivateKey(null);
  };

  const deleteAccount = async () => {
    try {
      if (user?.id) {
        await clearVaultKeys(user.id);
        localStorage.removeItem(`securechat_private_key_${user.id}`);
      }
      await axios.delete(`${API_URL}/users/me`);
      setUser(null);
      setPrivateKey(null);
      setSigningPrivateKey(null);
    } catch (e) {
      console.error('Failed to delete account', e);
      throw e;
    }
  };

  const getPrivateKey = async (): Promise<CryptoKey | null> => {
    return privateKey;
  };

  const getSigningPrivateKey = async (): Promise<CryptoKey | null> => {
    return signingPrivateKey;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      checkAuth, 
      login, 
      register, 
      logout, 
      deleteAccount, 
      getPrivateKey,
      getSigningPrivateKey
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
