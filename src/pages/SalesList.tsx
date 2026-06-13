import { Sales, SalesStatus } from '../types';
import { formatCurrency, formatDate, formatMonthLabel } from '../constants';

interface Props {
  groupedSales: { month: string; items: Sales[] }[];
  currentMonthTotal: number;
  onAdd: () => void;
  onSelect: (sales: Sales) => void;
}

const STATUS_COLOR: Record<SalesStatus, string> = {
  '見込み': 'var(--color-text-secondary)',
  '請求済': 'var(--color-text-warning)',
  '入金済': 'var(--color-text-success)',
};
const STATUS_BG: Record<SalesStatus, string> = {
  '見込み': 'var(--color-background-secondary)',
  '請求済': 'var(--color-background-warning)',
  '入金済': 'var(--color-background-success)',
};

export const SalesList = ({ groupedSales, currentMonthTotal, onAdd, onSelect }: Props) => {
  const currentCount = groupedSales[0]?.items.length ?? 0;
  const unpaidTotal = groupedSales
    .flatMap(g => g.items)
    .filter(s => s.status !== '入金済')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* サマリーバー */}
      <div style={summaryBarStyle}>
        <SummaryItem label="今月売上" value={formatCurrency(currentMonthTotal)} />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem
          label="未入金合計"
          value={formatCurrency(unpaidTotal)}
          valueColor={unpaidTotal > 0 ? 'var(--color-text-warning)' : undefined}
        />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem label="件数" value={`${currentCount}件`} />
      </div>

      {/* 一覧 */}
      <div>
        {groupedSales.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 60, fontSize: 14 }}>
            売上データがありません
          </div>
        )}
        {groupedSales.map(({ month, items }) => (
          <div key={month}>
            <div style={monthHeaderStyle}>{formatMonthLabel(month + '-01')}</div>
            {items.map(s => (
              <div key={s.id} onClick={() => onSelect(s)} style={rowStyle}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {formatDate(s.date)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {s.client}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 8,
                      background: STATUS_BG[s.status], color: STATUS_COLOR[s.status],
                    }}>
                      {s.status}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {formatCurrency(s.amount)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    入金予定 {formatDate(s.paymentDueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 追加ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0 4px' }}>
        <button onClick={onAdd} style={fabStyle} aria-label="新規売上を追加">＋</button>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: valueColor ?? 'var(--color-text-primary)' }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
  </div>
);

const summaryBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  background: 'var(--color-background-secondary)',
  borderRadius: 10, padding: '10px 0', margin: '0 0 12px',
};
const monthHeaderStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)',
  background: 'var(--color-background-secondary)',
  padding: '4px 12px', marginBottom: 2,
};
const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '12px 4px', borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer',
};
const fabStyle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: '50%',
  background: '#1a1a1a', color: '#ffffff', border: 'none',
  fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};
