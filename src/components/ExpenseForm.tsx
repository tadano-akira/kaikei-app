import { useState } from 'react';
import { Expense, ExpenseInput, TaxRate, AccountCategory, ExpenseType } from '../types';
import { ACCOUNT_CATEGORIES, TAX_RATES, calcTax, formatCurrency } from '../constants';

interface Props {
  initial?: Expense;
  onSave: (input: ExpenseInput) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export const ExpenseForm = ({ initial, onSave, onCancel }: Props) => {
  const [date, setDate] = useState(initial?.date ?? today());
  const [category, setCategory] = useState<AccountCategory>(initial?.category ?? '通信費');
  const [amountWithTax, setAmountWithTax] = useState(initial?.amountWithTax?.toString() ?? '');
  const [taxRate, setTaxRate] = useState<TaxRate>(initial?.taxRate ?? 10);
  const [payee, setPayee] = useState(initial?.payee ?? '');
  const [expenseType, setExpenseType] = useState<ExpenseType>(initial?.expenseType ?? '変動費');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [showDetail, setShowDetail] = useState(!!(initial?.purpose || initial?.memo));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = parseInt(amountWithTax.replace(/,/g, ''), 10) || 0;
  const { amountWithoutTax, taxAmount } = calcTax(amount, taxRate);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!date) e.date = '日付を入力してください';
    if (!amountWithTax || amount <= 0) e.amount = '金額を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ date, category, amountWithTax: amount, taxRate, payee, expenseType, purpose, memo });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 日付 */}
      <div>
        <label style={labelStyle}>日付 <span style={reqStyle}>必須</span></label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle, borderColor: errors.date ? 'var(--color-border-danger)' : undefined }}
        />
        {errors.date && <div style={errorStyle}>{errors.date}</div>}
      </div>

      {/* 勘定科目 */}
      <div>
        <label style={labelStyle}>勘定科目 <span style={reqStyle}>必須</span></label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as AccountCategory)}
          style={inputStyle}
        >
          {ACCOUNT_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* 金額 */}
      <div>
        <label style={labelStyle}>金額（税込） <span style={reqStyle}>必須</span></label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: 13 }}>¥</span>
          <input
            type="number"
            value={amountWithTax}
            onChange={e => setAmountWithTax(e.target.value)}
            placeholder="0"
            style={{ ...inputStyle, paddingLeft: 24, borderColor: errors.amount ? 'var(--color-border-danger)' : undefined }}
          />
        </div>
        {errors.amount && <div style={errorStyle}>{errors.amount}</div>}

        {/* 税率チップ */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TAX_RATES.map(r => (
            <button
              key={r}
              onClick={() => setTaxRate(r)}
              style={{
                ...chipStyle,
                  background: taxRate === r ? '#1a1a1a' : 'var(--color-background-secondary)',
                  color: taxRate === r ? '#ffffff' : 'var(--color-text-secondary)',
                  border: taxRate === r ? '1px solid #1a1a1a' : '0.5px solid var(--color-border-secondary)',
                  fontWeight: taxRate === r ? 600 : 400,
              }}
            >
              {r}%
            </button>
          ))}
        </div>

        {/* 自動計算表示 */}
        {amount > 0 && (
          <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--color-background-secondary)', borderRadius: 6, fontSize: 12 }}>
            <div style={calcRowStyle}>
              <span style={{ color: 'var(--color-text-secondary)' }}>税抜金額</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(amountWithoutTax)}</span>
            </div>
            <div style={calcRowStyle}>
              <span style={{ color: 'var(--color-text-secondary)' }}>消費税額</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(taxAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 支払先 */}
      <div>
        <label style={labelStyle}>支払先</label>
        <input
          type="text"
          value={payee}
          onChange={e => setPayee(e.target.value)}
          placeholder="例：AWS、ヨドバシ"
          style={inputStyle}
        />
      </div>

      {/* 分類 */}
      <div>
        <label style={labelStyle}>分類 <span style={reqStyle}>必須</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['固定費', '変動費'] as ExpenseType[]).map(t => (
            <button
              key={t}
              onClick={() => setExpenseType(t)}
              style={{
                ...chipStyle,
                flex: 1,
                background: expenseType === t ? '#1a1a1a' : 'var(--color-background-secondary)',
                color: expenseType === t ? '#ffffff' : 'var(--color-text-secondary)',
                border: expenseType === t ? '1px solid #1a1a1a' : '0.5px solid var(--color-border-secondary)',
                fontWeight: expenseType === t ? 500 : 400,
                padding: '8px 0',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 詳細（折りたたみ） */}
      <div>
        <button
          onClick={() => setShowDetail(v => !v)}
        style={{
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 8,
          color: 'var(--color-text-secondary)',
          fontSize: 13,
          cursor: 'pointer',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          justifyContent: 'center',
        }}
        >
          {showDetail ? '▲ 詳細を閉じる' : '＋ 詳細（利用目的・メモ）'}
        </button>
        {showDetail && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>利用目的</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="例：開発環境サーバー費"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>メモ</label>
              <textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="任意"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>キャンセル</button>
        <button onClick={handleSave} style={saveBtnStyle}>保存する</button>
      </div>
    </div>
  );
};

// ---- スタイル定数 ----
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  marginBottom: 4,
};
const reqStyle: React.CSSProperties = {
  color: 'var(--color-text-danger)',
  fontSize: 11,
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  boxSizing: 'border-box',
};
const chipStyle: React.CSSProperties = {
  padding: '4px 14px',
  borderRadius: 20,
  fontSize: 12,
  cursor: 'pointer',
};
const calcRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '2px 0',
};
const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-danger)',
  marginTop: 4,
};
const saveBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: '10px 0',
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  background: '#f0f0f0',
  color: '#444444',
  border: '0.5px solid #d0d0d0',
  borderRadius: 8,
  fontSize: 14,
  cursor: 'pointer',
};
