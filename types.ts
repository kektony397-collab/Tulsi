export interface Member {
  id: string; // UUID
  name: string;
  flatNumber: string;
  mobile: string;
  photoBase64: string | null;
  createdAt: number;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string; // Denormalized for easier receipt generation
  month: string; // "YYYY-MM"
  amount: number;
  date: string; // ISO Date
  note?: string;
}

export interface Expense {
  id: string;
  title: string; // e.g., "Electricity", "Cleaning"
  amount: number;
  date: string;
  category: 'Repair' | 'Cleaning' | 'Electricity' | 'Water' | 'Other';
}

export type ViewState = 'dashboard' | 'members' | 'finance' | 'notices';
export type ModalType = 'addMember' | 'addPayment' | 'addExpense' | 'viewReceipt' | 'viewNotice' | null;

// Helper type for Charts
export interface ChartData {
  name: string;
  value: number;
}