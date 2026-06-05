// InMemory fallback for environments like Expo Go that lack custom native JSI modules
class InMemoryStorage {
  private store = new Map<string, any>();

  getString(key: string): string | undefined {
    const val = this.store.get(key);
    return typeof val === 'string' ? val : undefined;
  }

  set(key: string, value: string | boolean | number | ArrayBuffer): void {
    this.store.set(key, value);
  }

  remove(key: string): boolean {
    return this.store.delete(key);
  }

  clearAll(): void {
    this.store.clear();
  }
}

let storageInstance: any;

try {
  // Dynamically require to avoid crash during static import in Expo Go sandbox
  const { createMMKV } = require('react-native-mmkv');
  storageInstance = createMMKV({
    id: 'expenseos-storage',
  });
} catch (e) {
  console.warn(
    'MMKV native module not found. Falling back to in-memory storage (normal for Expo Go).'
  );
  storageInstance = new InMemoryStorage();
}

export const storage = storageInstance;

export const StorageKeys = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER_EMAIL: 'user.email',
  USER_NAME: 'user.name',
  USER_ID: 'user.id',
};

export const getStorageItem = (key: string): string | null => {
  return storage.getString(key) ?? null;
};

export const setStorageItem = (key: string, value: string): void => {
  storage.set(key, value);
};

export const removeStorageItem = (key: string): void => {
  storage.remove(key);
};

export const clearStorage = (): void => {
  storage.clearAll();
};
