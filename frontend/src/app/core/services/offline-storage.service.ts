import { Injectable } from '@angular/core';

const DB_NAME = 'workflow-offline';
const DB_VERSION = 1;

type StoreName = 'activities' | 'tramites' | 'workflows' | 'form-drafts';

@Injectable({ providedIn: 'root' })
export class OfflineStorageService {
  private db: IDBDatabase | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = (e.target as IDBOpenDBRequest).result;
        (['activities', 'tramites', 'workflows', 'form-drafts'] as StoreName[]).forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        });
      };
      req.onsuccess = e => { this.db = (e.target as IDBOpenDBRequest).result; resolve(this.db!); };
      req.onerror  = () => reject(req.error);
    });
  }

  async saveAll(store: StoreName, items: any[]): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(store, 'readwrite');
    const s  = tx.objectStore(store);
    items.forEach(item => s.put(item));
    return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror   = () => reject(req.error);
    });
  }

  async save(store: StoreName, item: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).put(item);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async get<T>(store: StoreName, id: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror   = () => reject(req.error);
    });
  }

  async delete(store: StoreName, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }
}
