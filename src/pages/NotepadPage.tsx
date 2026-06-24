import { useNotepad } from '../hooks/useNotepad';

export const NotepadPage = ({ isGuest }: { isGuest: boolean }) => {
  const { content, saved, onChange, save } = useNotepad(isGuest);

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notepad.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: 1 }}>Notepad</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>テキスト入力</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={saved ? savedBadgeStyle : unsavedBadgeStyle}>
            {saved ? '✓ 保存済み' : '⚠ 未保存'}
          </span>
          <button onClick={save} style={saved ? btnStyle : saveBtnUnsavedStyle}>保存</button>
          <button onClick={handleDownload} style={btnStyle}>DL (.txt)</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
        {content.length.toLocaleString()} 文字
      </div>

      <textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        placeholder="ここにテキストを入力してください。「保存」ボタンでクラウドに保存されます。"
        style={{
          flex: 1,
          width: '100%',
          padding: '12px',
          borderRadius: 10,
          border: '0.5px solid var(--color-border-secondary)',
          background: '#f5f5f5',
          color: '#1a1a1a',
          fontSize: 14,
          lineHeight: 1.7,
          resize: 'none',
          fontFamily: 'monospace',
          boxSizing: 'border-box',
          minHeight: 400,
        }}
      />
    </div>
  );
};

const savedBadgeStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500,
  color: '#16a34a',
  background: '#f0fdf4',
  border: '0.5px solid #86efac',
  borderRadius: 6, padding: '4px 10px',
};

const unsavedBadgeStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700,
  color: '#ffffff',
  background: '#dc2626',
  borderRadius: 6, padding: '4px 10px',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8,
  background: '#f0f0f0',
  color: '#333333',
  border: '0.5px solid #d0d0d0',
  fontSize: 12, cursor: 'pointer',
};

const saveBtnUnsavedStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8,
  background: '#1a1a1a',
  color: '#ffffff',
  border: 'none',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
};