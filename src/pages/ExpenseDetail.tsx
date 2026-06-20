import { Expense } from '../types';
import { formatCurrency, formatDate } from '../constants';
import { useState } from 'react';

interface Props {
  expense: Expense;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export const ExpenseDetail = ({ expense, onEdit, onDelete, onBack }: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    onDelete(expense.id);
    onBack();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ヘッダーカード */}
      <div style={headerCardStyle}>
        <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {formatCurrency(expense.amountWithTax)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {expense.payee || expense.category}　／　{formatDate(expense.date)}
        </div>
      </div>

      {/* 詳細行 */}
      <div style={detailSectionStyle}>
        <DetailRow label="勘定科目" value={expense.category} />
        <DetailRow label="税率" value={`${expense.taxRate}%`} />
        <DetailRow label="税抜金額" value={formatCurrency(expense.amountWithoutTax)} />
        <DetailRow label="消費税額" value={formatCurrency(expense.taxAmount)} />
        <DetailRow
          label="分類"
          value={
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              background: expense.expenseType === '固定費'
                ? 'var(--color-background-warning)'
                : 'var(--color-background-success)',
              color: expense.expenseType === '固定費'
                ? 'var(--color-text-warning)'
                : 'var(--color-text-success)',
              fontWeight: 500,
            }}>
              {expense.expenseType}
            </span>
          }
        />
        {expense.purpose && <DetailRow label="利用目的" value={expense.purpose} />}
        {expense.memo && <DetailRow label="メモ" value={expense.memo} />}
        {expense.receiptUrl && (
          <DetailRow
            label="証票"
            value={
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563eb', fontSize: 13, textDecoration: 'none' }}
              >
                リンクを開く ↗
              </a>
            }
          />
        )}
        <DetailRow
          label="登録日"
          value={new Date(expense.createdAt).toLocaleDateString('ja-JP')}
        />
      </div>

      {/* アクションボタン */}
      {!confirmDelete ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onEdit} style={editBtnStyle}>
            ✎ 編集
          </button>
          <button onClick={() => setConfirmDelete(true)} style={deleteBtnStyle}>
            🗑 削除
          </button>
        </div>
      ) : (
        /* 削除確認 */
        <div style={confirmBoxStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-danger)', marginBottom: 6 }}>
            この経費を削除しますか？
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            {expense.payee || expense.category}　{formatCurrency(expense.amountWithTax)}
            <br />削除後は元に戻せません。
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={cancelBtnStyle}>
              キャンセル
            </button>
            <button onClick={handleDelete} style={confirmDeleteBtnStyle}>
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
  }}>
    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
);

const headerCardStyle: React.CSSProperties = {
  background: 'var(--color-background-secondary)',
  borderRadius: 12,
  padding: '16px',
  marginBottom: 16,
};
const detailSectionStyle: React.CSSProperties = {
  background: 'var(--color-background-primary)',
  borderRadius: 10,
  border: '0.5px solid var(--color-border-tertiary)',
  padding: '0 14px',
};
const editBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  background: '#f0f0f0',
  color: '#333333',
  border: '0.5px solid #d0d0d0',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
const deleteBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  background: '#fee2e2',
  color: '#dc2626',
  border: '0.5px solid #fca5a5',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
const confirmBoxStyle: React.CSSProperties = {
  marginTop: 24,
  padding: '14px 16px',
  background: '#fee2e2',
  border: '0.5px solid #fca5a5',
  borderRadius: 10,
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  background: '#f0f0f0',
  color: '#444444',
  border: '0.5px solid #d0d0d0',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
};
const confirmDeleteBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  background: '#dc2626',
  color: '#ffffff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};
