export enum UserID {
  A = 'UserA',
  B = 'UserB',
}

export enum Category {
  FOOD = 'Dining',
  TRANSPORT = 'Transport',
  SHOPPING = 'Shopping',
  GROCERIES = 'Groceries',
  HOUSING = 'Housing',
  ENTERTAINMENT = 'Entertainment',
  OTHER = 'Other',
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  item: string;
  amount: number;
  category: Category;
  payer: UserID;
  receiptUrl?: string; // Base64 or URL
  createdAt: number;
}

export interface ExpenseDraft {
  date: string;
  item: string;
  amount: number;
  category: Category;
}

export interface AppSettings {
  userAName: string;
  userBName: string;
  currentUserId: UserID;
}
