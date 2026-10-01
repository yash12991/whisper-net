/**
 * WhisperNet IndexedDB Secure Vault Key Store
 * Provides scoped storage for cryptographic keys, isolating them from localStorage XSS leakage.
 */

const DB_NAME = 'WhisperNetKeyVault_v1';
const DB_VERSION = 1;
const STORE_NAME = 'cryptographic_keys';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface VaultKeyRecord {
  userId: string;
  privateKeyJwk: string;
  signingPrivateKeyJwk?: string;
  updatedAt: number;
}

export async function saveKeysToVault(
  userId: string,
  privateKeyJwk: string,
  signingPrivateKeyJwk?: string
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: VaultKeyRecord = {
        userId,
        privateKeyJwk,
        signingPrivateKeyJwk,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to persist keys to IndexedDB vault:', err);
  }
}

export async function getKeysFromVault(userId: string): Promise<VaultKeyRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read keys from IndexedDB vault:', err);
    return null;
  }
}

export async function clearVaultKeys(userId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(userId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear keys from IndexedDB vault:', err);
  }
}
