import { AccountCategory, TaxRate } from '../types';

export const ACCOUNT_CATEGORIES: AccountCategory[] = [
  '通信費',
  '消耗品費',
  '地代家賃',
  '外注費',
  '旅費交通費',
  '接待交際費',
  '会議費',
  '広告宣伝費',
  '水道光熱費',
  '新聞図書費',
  'ソフトウェア利用料',
  '雑費',
];

export const TAX_RATES: TaxRate[] = [0, 8, 10];

// 税計算ユーティリティ
export const calcTax = (amountWithTax: number, taxRate: TaxRate) => {
  if (taxRate === 0) {
    return { amountWithoutTax: amountWithTax, taxAmount: 0 };
  }
  // 税抜 = 税込 ÷ (1 + 税率)  ※切り捨て
  const amountWithoutTax = Math.floor(amountWithTax / (1 + taxRate / 100));
  const taxAmount = amountWithTax - amountWithoutTax;
  return { amountWithoutTax, taxAmount };
};

// 金額フォーマット
export const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('ja-JP')}`;

// 日付フォーマット（YYYY-MM-DD → M月D日）
export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
};

// 月ラベル（YYYY-MM-DD → YYYY年M月）
export const formatMonthLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};
