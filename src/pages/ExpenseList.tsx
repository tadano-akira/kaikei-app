import { Expense } from '../types';
import { formatCurrency, formatDate, formatMonthLabel } from '../constants';

interface Props {
  groupedExpenses: { month: string; items: Expense[] }[];
  currentMonthTotal: number;
  onAdd: () => void;
  onSelect: (expense: Expense) => void;
}

export const ExpenseList = ({ groupedExpenses, currentMonthTotal, onAdd, onSelect }: Props) => {
  const budget = 200000; // TODO: 設定画面から取得
  const remaining = budget - currentMonthTotal;
  const currentCount = groupedExpenses[0]?.items.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* サマリーバー */}
      <div style={summaryBarStyle}>
        <SummaryItem label="今月経費" value={formatCurrency(currentMonthTotal)} />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem
          label="残予算"
          value={formatCurrency(remaining)}
          valueColor={remaining < 0 ? 'var(--color-text-danger)' : 'var(--color-text-success)'}
        />
        <div style={{ width: '0.5px', background: 'var(--color-border-tertiary)' }} />
        <SummaryItem label="件数" value={`${currentCount}件`} />
      </div>

      {/* 一覧 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groupedExpenses.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 60, fontSize: 14 }}>
            経費データがありません
          </div>
        )}
        {groupedExpenses.map(({ month, items }) => (
          <div key={month}>
            <div style={monthHeaderStyle}>
              {formatMonthLabel(month + '-01')}
            </div>
            {items.map(expense => (
              <div
                key={expense.id}
                onClick={() => onSelect(expense)}
                style={rowStyle}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {expense.category}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {expense.payee || expense.category}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {formatDate(expense.date)}
                    {' '}
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
                      marginLeft: 4,
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
            ))}
          </div>
        ))}
      </div>

      {/* FAB */}
      <button onClick={onAdd} style={fabStyle} aria-label="新規経費を追加">
        ＋
      </button>
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
  display: 'flex',
  alignItems: 'center',
  background: 'var(--color-background-secondary)',
  borderRadius: 10,
  padding: '10px 0',
  margin: '0 0 12px',
};
const monthHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  background: 'var(--color-background-secondary)',
  padding: '4px 12px',
  marginBottom: 2,
};
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '12px 4px',
  borderBottom: '0.5px solid var(--color-border-tertiary)',
  cursor: 'pointer',
};
const fabStyle: React.CSSProperties = {
  position: 'fixed' as const,
  bottom: 72,
  right: 24,
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'var(--color-background-info)',
  color: 'var(--color-text-info)',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};
