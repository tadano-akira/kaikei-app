import { Expense, Sales, Settings } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  expenses: Expense[];
  sales: Sales[];
  settings: Settings;
  onShowTaxDetail: () => void;
}

const TAX_TABLE = [
  { limit: 1_950_000,  rate: 0.05, deduction: 0 },
  { limit: 3_300_000,  rate: 0.10, deduction: 97_500 },
  { limit: 6_950_000,  rate: 0.20, deduction: 427_500 },
  { limit: 9_000_000,  rate: 0.23, deduction: 636_000 },
  { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
  { limit: Infinity,   rate: 0.45, deduction: 4_796_000 },
];

const PURCHASE_RATES: Record<string, number> = {
  '第1種': 0.9, '第2種': 0.8, '第3種': 0.7,
  '第4種': 0.6, '第5種': 0.5, '第6種': 0.4,
};

function calcIncomeTax(income: number): number {
  if (income <= 0) return 0;
  const { rate, deduction } = TAX_TABLE.find(t => income <= t.limit)!;
  return Math.max(0, Math.round(income * rate - deduction));
}

export const DashboardPage = ({ expenses, sales, settings, onShowTaxDetail }: Props) => {
  const now = new Date();
  const currentYM = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;

  // 今月
  const thisMonthSales = sales
    .filter(s => s.date.startsWith(currentYM))
    .reduce((sum, s) => sum + s.amount, 0);
  const thisMonthExp = expenses
    .filter(e => e.date.startsWith(currentYM))
    .reduce((sum, e) => sum + e.amountWithTax, 0);
  const thisMonthProfit = thisMonthSales - thisMonthExp;
  const budget = Math.round(thisMonthSales * settings.targetExpenseRate / 100);
  const remaining = budget > 0 ? budget - thisMonthExp : null;

  // 年間累計 (YTD)
  const ytdSales = sales.reduce((sum, s) => sum + s.amount, 0);

  // 経費：実データがある月は実額、ない月は売上×目標経費率で見込み
  const allYMs = new Set([
    ...sales.map(s => s.date.slice(0, 7)),
    ...expenses.map(e => e.date.slice(0, 7)),
  ]);
  let ytdExpCombined = 0;
  for (const ym of allYMs) {
    const monthExpenses = expenses.filter(e => e.date.startsWith(ym));
    if (monthExpenses.length > 0) {
      ytdExpCombined += monthExpenses.reduce((sum, e) => sum + e.amountWithTax, 0);
    } else {
      const monthSales = sales
        .filter(s => s.date.startsWith(ym))
        .reduce((sum, s) => sum + s.amount, 0);
      ytdExpCombined += Math.round(monthSales * settings.targetExpenseRate / 100);
    }
  }
  const ytdProfit = ytdSales - ytdExpCombined;

  // 税金試算（年初来実績ベース）
  const totalDeductions =
    settings.healthInsurance + settings.pension + settings.dependentDeduction +
    settings.lifeInsuranceDeduction + settings.idecoDeduction +
    settings.smallBusinessDeduction;
  const BLUE_DEDUCTION = 650_000;
  const BASIC_DEDUCTION = 480_000;
  const taxableIncome = Math.max(0, ytdProfit - BLUE_DEDUCTION - BASIC_DEDUCTION - totalDeductions);

  const incomeTax = calcIncomeTax(taxableIncome);
  const residentialTax = Math.round(taxableIncome * settings.residentialTaxRate / 100);

  // 消費税（売上10%税込前提で預かり消費税を算出）
  const vatReceived = Math.round(ytdSales * 10 / 110);
  const consumptionTax = settings.consumptionTaxSpecialRate > 0
    ? Math.round(vatReceived * settings.consumptionTaxSpecialRate)
    : Math.round(vatReceived * (1 - (PURCHASE_RATES[settings.consumptionTaxCategory] ?? 0.5)));
  const totalTax = incomeTax + residentialTax + consumptionTax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 今月 */}
      <Card>
        <CardTitle>{currentYear}年{currentMonthNum}月</CardTitle>
        <ThreeCol items={[
          { label: '売上',  value: formatCurrency(thisMonthSales) },
          { label: '経費',  value: formatCurrency(thisMonthExp) },
          { label: '利益',  value: formatCurrency(thisMonthProfit), color: thisMonthProfit < 0 ? '#dc2626' : '#15803d' },
        ]} />
        {budget > 0 && (
          <div style={budgetRowStyle}>
            <span style={{ fontSize: 12, color: '#888' }}>経費予算（枠）</span>
            <span style={{ fontSize: 13 }}>
              {formatCurrency(budget)}
              {remaining !== null && (
                <span style={{ marginLeft: 10, fontWeight: 500, color: remaining < 0 ? '#dc2626' : '#15803d' }}>
                  残 {formatCurrency(remaining)}
                </span>
              )}
            </span>
          </div>
        )}
      </Card>

      {/* 年間累計 */}
      <Card>
        <CardTitle>{currentYear}年 年初来累計</CardTitle>
        <ThreeCol items={[
          { label: '累計売上', value: formatCurrency(ytdSales) },
          { label: '累計経費(実額+見込額)', value: formatCurrency(ytdExpCombined) },
          { label: '累計利益', value: formatCurrency(ytdProfit), color: ytdProfit < 0 ? '#dc2626' : '#15803d' },
        ]} />
      </Card>

      {/* 税金試算 */}
      <Card>
        <CardTitle>税金試算（概算）</CardTitle>
        <TaxRow label="課税所得" value={formatCurrency(taxableIncome)} />
        <div style={dividerStyle} />
        <TaxRow label="所得税" value={formatCurrency(incomeTax)} />
        <TaxRow
          label="住民税"
          value={formatCurrency(residentialTax)}
          sub={`${settings.residentialTaxRate}%`}
        />
        <TaxRow
          label="消費税"
          value={formatCurrency(consumptionTax)}
          sub={settings.consumptionTaxSpecialRate > 0
            ? `特例係数 ${settings.consumptionTaxSpecialRate * 100}%`
            : `簡易課税 ${settings.consumptionTaxCategory}`}
        />
        <div style={dividerStyle} />
        <TaxRow label="合計税額" value={formatCurrency(totalTax)} bold />
        <p style={noteStyle}>
          ※ 青色申告控除65万・基礎控除48万・設定の各種控除を反映した概算です。経費未入力月は売上×目標経費率（{settings.targetExpenseRate}%）で見込み計上しています。
        </p>
        <button onClick={onShowTaxDetail} style={detailBtnStyle}>
          計算明細を見る →
        </button>
      </Card>

    </div>
  );
};

// ---- 小コンポーネント ----

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={cardStyle}>{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={cardTitleStyle}>{children}</div>
);

const ThreeCol = ({ items }: { items: { label: string; value: string; color?: string }[] }) => (
  <div style={threeColStyle}>
    {items.map((item, i) => (
      <div key={i} style={colItemStyle}>
        <div style={{ fontSize: 18, fontWeight: 600, color: item.color ?? '#1a1a1a' }}>
          {item.value}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{item.label}</div>
      </div>
    ))}
  </div>
);

const TaxRow = ({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) => (
  <div style={taxRowStyle}>
    <span style={{ fontSize: 13, color: '#555', fontWeight: bold ? 600 : 400 }}>
      {label}
      {sub && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>{sub}</span>}
    </span>
    <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: bold ? '#1a1a1a' : '#333' }}>
      {value}
    </span>
  </div>
);

// ---- スタイル ----

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '0.5px solid #e0e0e0',
  borderRadius: 12,
  padding: '16px',
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#888',
  letterSpacing: 0.5,
  marginBottom: 14,
  textTransform: 'uppercase',
};
const threeColStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
};
const colItemStyle: React.CSSProperties = {
  flex: 1,
  textAlign: 'center',
};
const budgetRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 12,
  paddingTop: 12,
  borderTop: '0.5px solid #f0f0f0',
};
const taxRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '7px 0',
};
const dividerStyle: React.CSSProperties = {
  height: '0.5px',
  background: '#e8e8e8',
  margin: '4px 0',
};
const noteStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#aaa',
  marginTop: 10,
  lineHeight: 1.6,
};
const detailBtnStyle: React.CSSProperties = {
  width: '100%', marginTop: 10, padding: '9px 0',
  background: '#f0f0f0', color: '#444', border: 'none',
  borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500,
};
