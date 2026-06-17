import { useState } from 'react';
import { Sales, SalesStatus } from '../types';
import { formatCurrency, formatDate, formatMonthLabel } from '../constants';

interface Props {
  groupedSales: { month: string; items: Sales[] }[];
  onAdd: () => void;
  onSelect: (sales: Sales) => void;
}

const STATUS_COLOR: Record<SalesStatus, string> = {
  '見込み': '#666666',
  '請求済': '#1d4ed8',
  '入金済': '#15803d',
};
const STATUS_BADGE_BG: Record<SalesStatus, string> = {
  '見込み': '#e5e5e5',
  '請求済': '#dbeafe',
  '入金済': '#dcfce7',
};
const STATUS_ROW_BG: Record<SalesStatus, string> = {
  '見込み': '#f5f5f5',
  '請求済': '#eff6ff',
  '入金済': '#f0fdf4',
};

const currentYM = new Date().toISOString().slice(0, 7);

export const SalesList = ({ groupedSales, onAdd, onSelect }: Props) => {
  const [monthIdx, setMonthIdx] = useState(0);

  const safeIdx = Math.min(monthIdx, Math.max(0, groupedSales.length - 1));
  const selectedGroup = groupedSales[safeIdx];
  const selectedItems = selectedGroup?.items ?? [];
  const selectedMonth = selectedGroup?.month ?? currentYM;

  const selectedTotal = selectedItems.reduce((sum, s) => sum + s.amount, 0);
  const unpaidTotal = selectedItems
    .filter(s => s.status !== '入金済')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 月ナビゲーター */}
      {groupedSales.length > 0 && (
        <MonthNav
          label={formatMonthLabel(selectedMonth + '-01')}
          onPrev={safeIdx < groupedSales.length - 1 ? () => setMonthIdx(safeIdx + 1) : undefined}
          onNext={safeIdx > 0 ? () => setMonthIdx(safeIdx - 1) : undefined}
        />
      )}

      {/* サマリーバー */}
      <div style={summaryBarStyle}>
        <SummaryItem label="月間売上" value={formatCurrency(selectedTotal)} />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem
          label="未入金"
          value={formatCurrency(unpaidTotal)}
          valueColor={unpaidTotal > 0 ? 'var(--color-text-warning)' : undefined}
        />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem label="件数" value={`${selectedItems.length}件`} />
      </div>

      {/* 追加ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 12px' }}>
        <button onClick={onAdd} style={fabStyle} aria-label="新規売上を追加">＋</button>
      </div>

      {/* 一覧 */}
      <div>
        {selectedItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 60, fontSize: 14 }}>
            売上データがありません
          </div>
        ) : (
          selectedItems.map(s => (
            <div key={s.id} onClick={() => onSelect(s)} style={{ ...rowStyle, background: STATUS_ROW_BG[s.status] }}>
              <div>
                <div style={{ fontSize: 11, color: '#888888', marginBottom: 2 }}>
                  {formatDate(s.date)}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                  {s.client}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 8,
                    background: STATUS_BADGE_BG[s.status], color: STATUS_COLOR[s.status],
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
          ))
        )}
      </div>

    </div>
  );
};

const MonthNav = ({ label, onPrev, onNext }: { label: string; onPrev?: () => void; onNext?: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
    <button onClick={onPrev} disabled={!onPrev} style={navBtnStyle(!onPrev)}>‹</button>
    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', minWidth: 110, textAlign: 'center' }}>
      {label}
    </span>
    <button onClick={onNext} disabled={!onNext} style={navBtnStyle(!onNext)}>›</button>
  </div>
);

const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'none', border: 'none', fontSize: 24, lineHeight: 1,
  color: 'var(--color-text-secondary)',
  cursor: disabled ? 'default' : 'pointer',
  padding: '4px 14px',
  opacity: disabled ? 0.25 : 1,
});

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
const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '12px 10px', borderBottom: '0.5px solid #e0e0e0', cursor: 'pointer',
  borderRadius: 8, marginBottom: 4,
};
const fabStyle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: '50%',
  background: '#1a1a1a', color: '#ffffff', border: 'none',
  fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};
