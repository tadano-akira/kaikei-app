import { Expense, Sales, Settings } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  expenses: Expense[];
  sales: Sales[];
  settings: Settings;
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

export const TaxDetailPage = ({ expenses, sales, settings }: Props) => {
  // 年初来累計
  const ytdSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const ytdExp   = expenses.reduce((sum, e) => sum + e.amountWithTax, 0);
  const businessIncome = ytdSales - ytdExp;

  // 控除明細
  const BLUE_DEDUCTION  = 650_000;
  const BASIC_DEDUCTION = 480_000;
  const socialInsurance = settings.healthInsurance + settings.pension;

  const deductions = [
    { label: '青色申告特別控除', amount: BLUE_DEDUCTION },
    { label: '基礎控除', amount: BASIC_DEDUCTION },
    { label: '健康保険料控除', amount: settings.healthInsurance },
    { label: '年金保険料控除', amount: settings.pension },
    { label: '扶養控除', amount: settings.dependentDeduction },
    { label: '生命保険料控除', amount: settings.lifeInsuranceDeduction },
    { label: 'iDeCo控除', amount: settings.idecoDeduction },
    { label: '小規模企業共済控除', amount: settings.smallBusinessDeduction },
  ].filter(d => d.amount > 0);

  const totalDeductions =
    BLUE_DEDUCTION + BASIC_DEDUCTION + socialInsurance +
    settings.dependentDeduction + settings.lifeInsuranceDeduction +
    settings.idecoDeduction + settings.smallBusinessDeduction;

  const taxableIncome = Math.max(0, businessIncome - totalDeductions);

  // 所得税
  const taxRow = TAX_TABLE.find(t => taxableIncome <= t.limit)!;
  const incomeTax = Math.max(0, Math.round(taxableIncome * taxRow.rate - taxRow.deduction));

  // 住民税
  const residentialTax = Math.round(taxableIncome * settings.residentialTaxRate / 100);

  // 消費税
  const vatReceived = Math.round(ytdSales * 10 / 110);
  const isSpecialRate = settings.consumptionTaxSpecialRate > 0;
  const purchaseRate  = PURCHASE_RATES[settings.consumptionTaxCategory] ?? 0.5;
  const consumptionTax = isSpecialRate
    ? Math.round(vatReceived * settings.consumptionTaxSpecialRate)
    : Math.round(vatReceived * (1 - purchaseRate));

  const totalTax = incomeTax + residentialTax + consumptionTax;

  // 粗利 = 年間売上 - 社会保険料 - 合計税額
  const grossProfit = ytdSales - socialInsurance - totalTax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 収入と経費 */}
      <Card title="収入と経費（年初来累計）">
        <CalcRow label="年間売上" value={formatCurrency(ytdSales)} />
        <CalcRow label="年間経費" value={`－${formatCurrency(ytdExp)}`} valueColor="#dc2626" />
        <SumRow label="事業所得" value={formatCurrency(businessIncome)} color={businessIncome < 0 ? '#dc2626' : '#1a1a1a'} />
      </Card>

      {/* 所得控除 */}
      <Card title="所得控除">
        {deductions.length === 0 ? (
          <div style={{ fontSize: 13, color: '#aaa', padding: '8px 0' }}>控除の設定がありません（設定画面で入力してください）</div>
        ) : (
          deductions.map(d => (
            <CalcRow key={d.label} label={d.label} value={`－${formatCurrency(d.amount)}`} valueColor="#555" />
          ))
        )}
        <SumRow label="控除合計" value={`－${formatCurrency(totalDeductions)}`} color="#555" />
      </Card>

      {/* 課税所得 */}
      <div style={taxableBoxStyle}>
        <span style={{ fontSize: 13, color: '#555' }}>課税所得</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{formatCurrency(taxableIncome)}</span>
      </div>

      {/* 所得税 */}
      <Card title="所得税">
        <CalcRow label="税率" value={`${taxRow.rate * 100}%`} />
        <CalcRow label="税額控除" value={`－${formatCurrency(taxRow.deduction)}`} valueColor="#555" />
        <div style={{ fontSize: 11, color: '#aaa', padding: '4px 0 8px' }}>
          {formatCurrency(taxableIncome)} × {taxRow.rate * 100}% － {formatCurrency(taxRow.deduction)}
        </div>
        <SumRow label="所得税額" value={formatCurrency(incomeTax)} />
      </Card>

      {/* 住民税 */}
      <Card title="住民税">
        <CalcRow label="税率" value={`${settings.residentialTaxRate}%`} />
        <div style={{ fontSize: 11, color: '#aaa', padding: '4px 0 8px' }}>
          {formatCurrency(taxableIncome)} × {settings.residentialTaxRate}%
        </div>
        <SumRow label="住民税額" value={formatCurrency(residentialTax)} />
      </Card>

      {/* 消費税 */}
      <Card title="消費税（簡易課税）">
        <CalcRow label="売上預かり消費税" value={formatCurrency(vatReceived)} />
        {isSpecialRate ? (
          <>
            <CalcRow label="特例係数" value={`${settings.consumptionTaxSpecialRate * 100}%`} />
            <div style={{ fontSize: 11, color: '#aaa', padding: '4px 0 8px' }}>
              {formatCurrency(vatReceived)} × {settings.consumptionTaxSpecialRate * 100}%（インボイス特例）
            </div>
          </>
        ) : (
          <>
            <CalcRow label={`みなし仕入率（${settings.consumptionTaxCategory}）`} value={`${purchaseRate * 100}%`} />
            <div style={{ fontSize: 11, color: '#aaa', padding: '4px 0 8px' }}>
              {formatCurrency(vatReceived)} × （1 － {purchaseRate * 100}%）
            </div>
          </>
        )}
        <SumRow label="消費税納付額" value={formatCurrency(consumptionTax)} />
      </Card>

      {/* 合計 */}
      <div style={totalBoxStyle}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>合計税額</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          <TotalItem label="所得税" value={formatCurrency(incomeTax)} />
          <TotalItem label="住民税" value={formatCurrency(residentialTax)} />
          <TotalItem label="消費税" value={formatCurrency(consumptionTax)} />
        </div>
        <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>合計</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{formatCurrency(totalTax)}</span>
        </div>
      </div>

      {/* 粗利 */}
      <div style={grossProfitBoxStyle}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
          粗利（年間売上 － 社会保険料 － 税金）
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
            <div>{formatCurrency(ytdSales)}</div>
            <div>－ {formatCurrency(socialInsurance)}（社会保険料）</div>
            <div>－ {formatCurrency(totalTax)}（合計税額）</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#888' }}>粗利</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: grossProfit < 0 ? '#dc2626' : '#15803d' }}>
              {formatCurrency(grossProfit)}
            </div>
          </div>
        </div>
      </div>

      <p style={noteStyle}>
        ※ 年初来の実績に基づく概算です。青色申告65万控除・基礎控除48万を含みます。
        確定申告は e-Tax でご確認ください。
      </p>
    </div>
  );
};

// ---- 小コンポーネント ----

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={cardStyle}>
    <div style={cardTitleStyle}>{title}</div>
    {children}
  </div>
);

const CalcRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #f0f0f0' }}>
    <span style={{ fontSize: 13, color: '#666' }}>{label}</span>
    <span style={{ fontSize: 13, color: valueColor ?? '#333' }}>{value}</span>
  </div>
);

const SumRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 700, color: color ?? '#1a1a1a' }}>{value}</span>
  </div>
);

const TotalItem = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
    <span style={{ fontSize: 13, color: '#555' }}>{value}</span>
  </div>
);

// ---- スタイル ----

const cardStyle: React.CSSProperties = {
  background: '#ffffff', border: '0.5px solid #e0e0e0', borderRadius: 12, padding: '14px 16px',
};
const cardTitleStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10,
};
const taxableBoxStyle: React.CSSProperties = {
  background: '#f8f8f8', border: '1px solid #d0d0d0', borderRadius: 12,
  padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
const totalBoxStyle: React.CSSProperties = {
  background: '#f0f0f0', borderRadius: 12, padding: '16px',
};
const grossProfitBoxStyle: React.CSSProperties = {
  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px',
};
const noteStyle: React.CSSProperties = {
  fontSize: 10, color: '#aaa', lineHeight: 1.6, marginBottom: 8,
};
