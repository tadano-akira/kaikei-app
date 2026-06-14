import { useState } from 'react';
import { Sales, SalesStatus } from '../types';
import { formatCurrency, formatDate } from '../constants';

interface Props {
  sales: Sales;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onBack: () => void;
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

export const SalesDetail = ({ sales, onEdit, onDelete, onBack }: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    onDelete(sales.id);
    onBack();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ヘッダーカード */}
      <div style={headerCardStyle}>
        <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {formatCurrency(sales.amount)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {sales.client}　／　{formatDate(sales.date)}
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 10,
            background: STATUS_BG[sales.status], color: STATUS_COLOR[sales.status], fontWeight: 500,
          }}>
            {sales.status}
          </span>
        </div>
      </div>

      {/* 詳細行 */}
      <div style={detailSectionStyle}>
        <DetailRow label="売上発生日" value={formatDate(sales.date)} />
        <DetailRow label="入金予定日" value={formatDate(sales.paymentDueDate)} />
        {sales.paymentDate && (
          <DetailRow label="入金日" value={formatDate(sales.paymentDate)} />
        )}
        {sales.memo && <DetailRow label="メモ" value={sales.memo} />}
        <DetailRow label="登録日" value={new Date(sales.createdAt).toLocaleDateString('ja-JP')} />
      </div>

      {/* アクションボタン */}
      {!confirmDelete ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onEdit} style={editBtnStyle}>✎ 編集</button>
          <button onClick={() => setConfirmDelete(true)} style={deleteBtnStyle}>🗑 削除</button>
        </div>
      ) : (
        <div style={confirmBoxStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-danger)', marginBottom: 6 }}>
            この売上を削除しますか？
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            {sales.client}　{formatCurrency(sales.amount)}
            <br />削除後は元に戻せません。
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={cancelBtnStyle}>キャンセル</button>
            <button onClick={handleDelete} style={confirmDeleteBtnStyle}>削除する</button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)',
  }}>
    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
);

const headerCardStyle: React.CSSProperties = {
  background: 'var(--color-background-secondary)', borderRadius: 12, padding: '16px', marginBottom: 16,
};
const detailSectionStyle: React.CSSProperties = {
  background: 'var(--color-background-primary)', borderRadius: 10,
  border: '0.5px solid var(--color-border-tertiary)', padding: '0 14px',
};
const editBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#f0f0f0',
  color: '#333333', border: '0.5px solid #d0d0d0',
  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const deleteBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#fee2e2',
  color: '#dc2626', border: '0.5px solid #fca5a5',
  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const confirmBoxStyle: React.CSSProperties = {
  marginTop: 24, padding: '14px 16px',
  background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: 10,
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px 0', background: '#f0f0f0',
  color: '#444444', border: '0.5px solid #d0d0d0',
  borderRadius: 6, fontSize: 13, cursor: 'pointer',
};
const confirmDeleteBtnStyle: React.CSSProperties = {
  flex: 1, padding: '8px 0', background: '#dc2626',
  color: '#ffffff', border: 'none',
  borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
