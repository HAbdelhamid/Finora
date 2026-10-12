export type WorkspaceKind = "personal" | "freelance" | "company";
export type FlowType = "income" | "expense" | "transfer" | "debt_out" | "debt_in";
export type AccountKind = "checking" | "cash" | "savings";
export type Category = string;

export interface ZakatConfig {
  basis: "gold" | "silver";
  goldPricePerGram: number;
  silverPricePerGram: number;
  goldGrams: number;
  silverGrams: number;
  otherCash: number;
  tradeInventory: number;
  collectibleReceivables: number;
  immediatelyDueLiabilities: number;
  haulStart: string;
  reminderDays: number;
  includeInvestments: boolean;
}

export interface Workspace {
  id: string; name: string; kind: WorkspaceKind; currency: string; country: string;
  monthlySalary: number; taxRate: number; taxBasis: "revenue" | "profit";
  demo: boolean; zakat: ZakatConfig;
}

export interface Account {
  id: string; workspaceId: string; name: string; kind: AccountKind; openingBalance: number;
}

export interface Transaction {
  id: string; workspaceId: string; accountId: string; toAccountId?: string;
  type: FlowType; amount: number; category: Category; description: string; date: string;
}

export interface Budget {
  id: string; workspaceId: string; category: string; limit: number;
}

export interface Goal {
  id: string; workspaceId: string; name: string; target: number; saved: number; color: string;
}

export interface Investment {
  id: string; workspaceId: string; name: string; symbol: string; units: number;
  costPerUnit: number; pricePerUnit: number; assetClass: "stocks" | "funds" | "crypto" | "other";
}

export interface Debt {
  id: string; workspaceId: string; name: string; direction: "owe" | "owed";
  principal: number; paid: number;
}

export interface RecurringRule {
  id: string; workspaceId: string; accountId: string; name: string;
  type: "income" | "expense"; amount: number; category: string;
  day: number; enabled: boolean;
}

export interface FinoraData {
  activeId: string;
  workspaces: Workspace[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  investments: Investment[];
  debts: Debt[];
  recurring: RecurringRule[];
}

export const incomeCategories = ["Salary","Freelance","Business sales","Rental income","Bonus","Gift","Other income"];
export const expenseCategories = ["Housing","Groceries","Transport","Restaurants","Shopping","Utilities","Health","Education","Subscriptions","Travel","Business expenses","Taxes","Other"];
export const categoryColors = ["#00a888","#6965db","#f0a95d","#518ad6","#e47d86","#7e96a6","#af8cda","#9ebf66"];

export const defaultZakat = (): ZakatConfig => ({
  basis:"gold",goldPricePerGram:0,silverPricePerGram:0,goldGrams:0,silverGrams:0,
  otherCash:0,tradeInventory:0,collectibleReceivables:0,immediatelyDueLiabilities:0,
  haulStart:"",reminderDays:14,includeInvestments:true
});

export const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2);
export const today = () => new Date().toISOString().slice(0,10);
export const monthKey = (date:string) => date.slice(0,7);
export const formatMoney = (amount:number,currency="MAD",compact=false) => new Intl.NumberFormat("en-US",{
 style:"currency",currency,maximumFractionDigits:compact?0:2,notation:compact?"compact":"standard"
}).format(Number.isFinite(amount)?amount:0);
