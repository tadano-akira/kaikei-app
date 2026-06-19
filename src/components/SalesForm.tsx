import { useState } from 'react';
import { Sales, SalesInput, SalesStatus } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  initial?: Sales;
  onSave: (input: SalesInput) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const STATUSES: SalesStatus[] = ['見込み', '請求済', '入金済'];

export const SalesForm = ({ initial, onSave, onCancel }: Props) => {
  const [date, setDate] = useState(initial?.date ?? today());
  const [paymentDueDate, setPaymentDueDate] = useState(initial?.paymentDueDate ?? '');
  const [paymentDate, setPaymentDate] = useState(initial?.paymentDate ?? '');
  const [status, setStatus] = useState<SalesStatus>(initial?.status ?? '見込み');
  const [client, setClient] = useState(initial?.client ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedAmount = parseInt(amount.replace(/,/g, ''), 10) || 0;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!date) e.date = '売上発生日を入力してください';
    if (!paymentDueDate) e.paymentDueDate = '入金予定日を入力してください';
    if (!client.trim()) e.client = '請求先を入力してください';
    if (!amount || parsedAmount <= 0) e.amount = '金額を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const input: SalesInput = { date, paymentDueDate, status, client, amount: parsedAmount };
    if (paymentDate) input.paymentDate = paymentDate;
    if (memo.trim()) input.memo = memo;
    onSave(input);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 売上発生日 */}
      <div>
        <label style={labelStyle}>売上発生日 <span style={reqStyle}>必須</span></label>
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle, borderColor: errors.date ? 'var(--color-border-danger)' : undefined }}
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}
      </div>

      {/* 請求先 */}
      <div>
        <label style={labelStyle}>請求先 <span style={reqStyle}>必須</span></label>
        <input
          type="text" value={client} onChange={e => setClient(e.target.value)}
          placeholder="例：株式会社〇〇"
          style={{ ...inputStyle, borderColor: errors.client ? 'var(--color-border-danger)' : undefined }}
        />
        {errors.client && <div style={errorStyle}>{errors.client}</div>}
      </div>

      {/* 金額 */}
      <div>
        <label style={labelStyle}>金額（税込） <span style={reqStyle}>必須</span></label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: 13 }}>¥</span>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0"
            style={{ ...inputStyle, paddingLeft: 24, borderColor: errors.amount ? 'var(--color-border-danger)' : undefined }}
          />
        </div>
        {errors.amount && <div style={errorStyle}>{errors.amount}</div>}
        {parsedAmount > 0 && (
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {formatCurrency(parsedAmount)}
          </div>
        )}
      </div>

      {/* ステータス */}
      <div>
        <label style={labelStyle}>ステータス <span style={reqStyle}>必須</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{
              flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              background: status === s ? statusBg[s] : 'var(--color-background-secondary)',
              color: status === s ? statusColor[s] : 'var(--color-text-secondary)',
              border: status === s ? `1px solid ${statusColor[s]}` : '0.5px solid var(--color-border-secondary)',
              fontWeight: status === s ? 600 : 400,
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 入金予定日 */}
      <div>
        <label style={labelStyle}>入金予定日 <span style={reqStyle}>必須</span></label>
        <input
          type="date" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)}
          style={{ ...inputStyle, borderColor: errors.paymentDueDate ? 'var(--color-border-danger)' : undefined }}
        />
        {errors.paymentDueDate && <div style={errorStyle}>{errors.paymentDueDate}</div>}
      </div>

      {/* 入金日（入金済の場合） */}
      {status === '入金済' && (
        <div>
          <label style={labelStyle}>入金日</label>
          <input
            type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {/* メモ */}
      <div>
        <label style={labelStyle}>メモ</label>
        <textarea
          value={memo} onChange={e => setMemo(e.target.value)}
          placeholder="任意"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* ボタン */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>キャンセル</button>
        <button onClick={handleSave} style={saveBtnStyle}>保存する</button>
      </div>
    </div>
  );
};

const statusBg: Record<SalesStatus, string> = {
  '見込み': 'var(--color-background-secondary)',
  '請求済': 'var(--color-background-warning)',
  '入金済': 'var(--color-background-success)',
};
const statusColor: Record<SalesStatus, string> = {
  '見込み': 'var(--color-text-secondary)',
  '請求済': 'var(--color-text-warning)',
  '入金済': 'var(--color-text-success)',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 };
const reqStyle: React.CSSProperties = { color: 'var(--color-text-danger)', fontSize: 11 };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 14, boxSizing: 'border-box',
};
const errorStyle: React.CSSProperties = { fontSize: 11, color: 'var(--color-text-danger)', marginTop: 4 };
const saveBtnStyle: React.CSSProperties = {
  flex: 2, padding: '10px 0', background: '#2563eb',
  color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#f0f0f0',
  color: '#444444', border: '0.5px solid #d0d0d0',
  borderRadius: 8, fontSize: 14, cursor: 'pointer',
};
