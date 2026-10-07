import { defaults, validateData, type Data } from "./core";
export class Repository {
  private db: IDBDatabase | null = null;
  recovered = false;
  async open() {
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("skybridge32", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("state");
        request.result.createObjectStore("recovery");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Tutup tab lain lalu coba lagi."));
    });
    this.db.onversionchange = () => this.db?.close();
  }
  private transaction(
    store: string,
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Penyimpanan belum siap"));
        return;
      }
      const tx = this.db.transaction(store, mode);
      const request = action(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  async load(): Promise<Data> {
    const raw = await this.transaction("state", "readonly", (s) =>
      s.get("app"),
    );
    if (raw === undefined) {
      const initial = defaults();
      await this.save(initial);
      return initial;
    }
    try {
      return validateData(raw);
    } catch {
      this.recovered = true;
      await this.transaction("recovery", "readwrite", (s) =>
        s.put(raw, "invalid"),
      );
      const initial = defaults();
      await this.save(initial);
      return initial;
    }
  }
  async save(data: Data) {
    await this.transaction("state", "readwrite", (s) =>
      s.put(validateData(data), "app"),
    );
  }
  async reset() {
    if (!this.db) throw new Error("Penyimpanan belum siap");
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(["state", "recovery"], "readwrite");
      tx.objectStore("state").clear();
      tx.objectStore("recovery").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const data = defaults();
    await this.save(data);
    this.recovered = false;
    return data;
  }
  async recovery() {
    return this.transaction("recovery", "readonly", (s) => s.get("invalid"));
  }
  close() {
    this.db?.close();
  }
}
