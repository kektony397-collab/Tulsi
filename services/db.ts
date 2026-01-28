import { Member, Payment, Expense } from '../types';

const DB_NAME = 'TulsiAptDB';
const DB_VERSION = 1;

class DatabaseService {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Members Store
        if (!db.objectStoreNames.contains('members')) {
          db.createObjectStore('members', { keyPath: 'id' });
        }
        
        // Payments Store
        if (!db.objectStoreNames.contains('payments')) {
          const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentStore.createIndex('memberId', 'memberId', { unique: false });
          paymentStore.createIndex('month', 'month', { unique: false });
        }

        // Expenses Store
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Generic Helpers
  private async getTransaction(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.open();
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // Member Operations
  async addMember(member: Member): Promise<void> {
    const store = await this.getTransaction('members', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(member);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMembers(): Promise<Member[]> {
    const store = await this.getTransaction('members', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Payment Operations
  async addPayment(payment: Payment): Promise<void> {
    const store = await this.getTransaction('payments', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(payment);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPayments(): Promise<Payment[]> {
    const store = await this.getTransaction('payments', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPaymentsByMember(memberId: string): Promise<Payment[]> {
    const db = await this.open();
    const tx = db.transaction('payments', 'readonly');
    const index = tx.objectStore('payments').index('memberId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(memberId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Expense Operations
  async addExpense(expense: Expense): Promise<void> {
    const store = await this.getTransaction('expenses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(expense);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllExpenses(): Promise<Expense[]> {
    const store = await this.getTransaction('expenses', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new DatabaseService();