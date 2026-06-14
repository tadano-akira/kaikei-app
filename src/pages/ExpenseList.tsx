import { useState } from 'react';
import { Expense } from '../types';
import { formatCurrency, formatDate, formatMonthLabel } from '../constants';

interface Props {
  groupedExpenses: { month: string; items: Expense[] }[];
  budget?: number;
  onAdd: () => void;
  onSelect: (expense: Expense) => void;
}

const currentYM = new Date().toISOString().slice(0, 7);

export const ExpenseList = ({ groupedExpenses, budget = 0, onAdd, onSelect }: Props) => {
  const [monthIdx, setMonthIdx] = useState(0);

  const safeIdx = Math.min(monthIdx, Math.max(0, groupedExpenses.length - 1));
  const selectedGroup = groupedExpenses[safeIdx];
  const selectedItems = selectedGroup?.items ?? [];
  const selectedMonth = selectedGroup?.month ?? currentYM;

  const selectedTotal = selectedItems.reduce((sum, e) => sum + e.amountWithTax, 0);
  const isCurrentMonth = selectedMonth === currentYM;
  const remaining = (isCurrentMonth && budget > 0) ? budget - selectedTotal : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 月ナビゲーター */}
      {groupedExpenses.length > 0 && (
        <MonthNav
          label={formatMonthLabel(selectedMonth + '-01')}
          onPrev={safeIdx < groupedExpenses.length - 1 ? () => setMonthIdx(safeIdx + 1) : undefined}
          onNext={safeIdx > 0 ? () => setMonthIdx(safeIdx - 1) : undefined}
        />
      )}

      {/* サマリーバー */}
      <div style={summaryBarStyle}>
        <SummaryItem label="月間経費" value={formatCurrency(selectedTotal)} />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem
          label="残予算"
          value={remaining !== null ? formatCurrency(remaining) : '－'}
          valueColor={
            remaining === null ? 'var(--color-text-tertiary)'
            : remaining < 0 ? 'var(--color-text-danger)'
            : 'var(--color-text-success)'
          }
          hint={isCurrentMonth && budget > 0 ? `枠 ${formatCurrency(budget)}` : undefined}
        />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem label="件数" value={`${selectedItems.length}件`} />
      </div>

      {/* 追加ボタン */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 12px' }}>
        <button onClick={onAdd} style={fabStyle} aria-label="新規経費を追加">＋</button>
      </div>

      {/* 一覧 */}
      <div>
        {selectedItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 60, fontSize: 14 }}>
            経費データがありません
          </div>
        ) : (
          selectedItems.map(expense => (
            <div key={expense.id} onClick={() => onSelect(expense)} style={rowStyle}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                  {expense.category}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {expense.payee || expense.category}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {formatDate(expense.date)}
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: expense.expenseType === '固定費'
                      ? 'var(--color-background-warning)'
                      : 'var(--color-background-success)',
                    color: expense.expenseType === '固定費'
                      ? 'var(--color-text-warning)'
                      : 'var(--color-text-success)',
                    marginLeft: 6,
                  }}>
                    {expense.expenseType}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {formatCurrency(expense.amountWithTax)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  税込 {expense.taxRate}%
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

const SummaryItem = ({ label, value, valueColor, hint }: { label: string; value: string; valueColor?: string; hint?: string }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: valueColor ?? 'var(--color-text-primary)' }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
    {hint && <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{hint}</div>}
  </div>
);

const summaryBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  background: 'var(--color-background-secondary)',
  borderRadius: 10, padding: '10px 0', margin: '0 0 12px',
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
