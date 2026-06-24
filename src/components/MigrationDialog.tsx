import { useState } from 'react';
import { GuestDataSummary } from '../lib/localStore';

type Step = 'choice' | 'confirmDiscard';

interface Props {
  summary: GuestDataSummary;
  migrating: boolean;
  error: string | null;
  onMigrate: () => void;
  onDiscard: () => void;
}

const summaryLine = (summary: GuestDataSummary): string => {
  const parts: string[] = [];
  if (summary.expenses > 0) parts.push(`経費${summary.expenses}件`);
  if (summary.sales > 0) parts.push(`売上${summary.sales}件`);
  if (summary.todos > 0) parts.push(`ToDo${summary.todos}件`);
  if (summary.memos > 0) parts.push(`メモ${summary.memos}件`);
  if (summary.dailyReports > 0) parts.push(`日報${summary.dailyReports}件`);
  if (summary.hasNotepad) parts.push('テキスト1件');
  if (summary.hasSettings) parts.push('設定');
  return parts.join('・') || 'データ';
};

export const MigrationDialog = ({ summary, migrating, error, onMigrate, onDiscard }: Props) => {
  const [step, setStep] = useState<Step>('choice');

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        {step === 'choice' && (
          <>
            <div style={titleStyle}>ゲストデータが見つかりました</div>
            <div style={bodyTextStyle}>
              {summaryLine(summary)}のデータが見つかりました。
              <br />
              クラウド（このGoogleアカウント）に移行しますか？
            </div>
            {error && <div style={errorTextStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setStep('confirmDiscard')}
                style={discardBtnStyle}
                disabled={migrating}
              >
                破棄してログイン
              </button>
              <button
                onClick={onMigrate}
                style={migrateBtnStyle}
                disabled={migrating}
              >
                {migrating ? '移行中...' : 'クラウドに移行する'}
              </button>
            </div>
          </>
        )}

        {step === 'confirmDiscard' && (
          <>
            <div style={{ ...titleStyle, color: 'var(--color-text-danger, #dc2626)' }}>
              本当に削除してよろしいですか？
            </div>
            <div style={bodyTextStyle}>
              {summaryLine(summary)}のデータは元に戻せません。
              <br />
              このまま削除してログインを続けます。
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setStep('choice')}
                style={cancelBtnStyle}
                disabled={migrating}
              >
                キャンセル
              </button>
              <button
                onClick={onDiscard}
                style={confirmDeleteBtnStyle}
                disabled={migrating}
              >
                削除する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
};
const boxStyle: React.CSSProperties = {
  background: 'var(--color-background-primary, #fff)',
  borderRadius: 14, padding: '22px 20px', maxWidth: 360, width: '100%',
};
const titleStyle: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10,
};
const bodyTextStyle: React.CSSProperties = {
  fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6,
};
const errorTextStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-text-danger, #dc2626)', marginTop: 10,
};
const migrateBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#1a1a1a', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const discardBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#f0f0f0', color: '#444444',
  border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#f0f0f0', color: '#444444',
  border: '0.5px solid #d0d0d0', borderRadius: 8, fontSize: 13, cursor: 'pointer',
};
const confirmDeleteBtnStyle: React.CSSProperties = {
  flex: 1, padding: '10px 0', background: '#dc2626', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
