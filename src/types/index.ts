// 勘定科目
export type AccountCategory =
  | '通信費'
  | '消耗品費'
  | '地代家賃'
  | '外注費'
  | '旅費交通費'
  | '接待交際費'
  | '会議費'
  | '広告宣伝費'
  | '水道光熱費'
  | '新聞図書費'
  | 'ソフトウェア利用料'
  | '雑費';

// 税率
export type TaxRate = 0 | 8 | 10;

// 固定費 / 変動費
export type ExpenseType = '固定費' | '変動費';

// 経費データ
export interface Expense {
  id: string;
  date: string;           // YYYY-MM-DD
  category: AccountCategory;
  amountWithTax: number;  // 税込金額
  taxRate: TaxRate;
  amountWithoutTax: number; // 税抜金額（自動計算）
  taxAmount: number;        // 消費税額（自動計算）
  payee: string;            // 支払先
  expenseType: ExpenseType;
  purpose?: string;         // 利用目的（任意）
  memo?: string;            // メモ（任意）
  createdAt: string;
  updatedAt: string;
}

// 経費入力フォーム用（idや計算値を除いた入力データ）
export type ExpenseInput = Omit<Expense, 'id' | 'amountWithoutTax' | 'taxAmount' | 'createdAt' | 'updatedAt'>;


// ===== ToDo =====
export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== メモ =====
export type MemoCategory = 'command' | 'script' | 'prompt' | 'other';

export interface Memo {
  id: string;
  title: string;
  category: MemoCategory;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// ===== ノートパッド =====
export interface Notepad {
  content: string;
  updatedAt: string;
}

// ===== 売上 =====
export type SalesStatus = '見込み' | '請求済' | '入金済';

export interface Sales {
  id: string;
  date: string;            // 売上発生日 YYYY-MM-DD
  paymentDueDate: string;  // 入金予定日 YYYY-MM-DD
  paymentDate?: string;    // 入金日 YYYY-MM-DD（任意）
  status: SalesStatus;
  client: string;          // 請求先
  amount: number;          // 金額（税込）
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type SalesInput = Omit<Sales, 'id' | 'createdAt' | 'updatedAt'>;

// ===== 設定 =====
export type ConsumptionTaxCategory = '第1種' | '第2種' | '第3種' | '第4種' | '第5種' | '第6種';

export interface Settings {
  targetExpenseRate: number;         // 目標経費率 (%)
  residentialTaxRate: number;        // 住民税率 (%), default 10
  consumptionTaxCategory: ConsumptionTaxCategory;
  consumptionTaxSpecialRate: number; // 消費税特例係数 (0.0〜1.0)
  healthInsurance: number;           // 健康保険料 (円)
  pension: number;                   // 年金保険料 (円)
  dependentDeduction: number;        // 扶養控除 (円)
  lifeInsuranceDeduction: number;    // 生命保険料控除 (円)
  idecoDeduction: number;            // iDeCo控除 (円)
  smallBusinessDeduction: number;    // 小規模企業共済控除 (円)
  updatedAt: string;
}

// ===== 日報 =====
export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD
  done: string;
  plan: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}