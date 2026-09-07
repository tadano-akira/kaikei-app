import { useEffect, useRef } from 'react';
import { useNotepad } from '../hooks/useNotepad';

// プルダウンから挿入する Markdown 記法の一覧。忘れがちな記法をここに登録しておく。
// block: true の記法は、行頭でない位置に挿入するとき自動で改行を前置する。
type MdSnippet = { group: string; label: string; text: string; block?: boolean };

// 並びは「つい忘れがちな順」。
const MD_GROUPS = ['ブロック', 'リスト', '装飾', '見出し'] as const;

const MD_SNIPPETS: MdSnippet[] = [
  { group: '見出し', label: '見出し1  #', text: '# 見出し1\n', block: true },
  { group: '見出し', label: '見出し2  ##', text: '## 見出し2\n', block: true },
  { group: '見出し', label: '見出し3  ###', text: '### 見出し3\n', block: true },
  { group: '見出し', label: '見出し4  ####', text: '#### 見出し4\n', block: true },
  { group: '装飾', label: '太字  **text**', text: '**太字**' },
  { group: '装飾', label: '斜体  *text*', text: '*斜体*' },
  { group: '装飾', label: '引用  >', text: '> 引用文\n', block: true },
  { group: '装飾', label: '水平線  ---', text: '\n---\n' },
  { group: 'リスト', label: '箇条書きリスト  -', text: '- 項目1\n- 項目2\n- 項目3\n', block: true },
  { group: 'リスト', label: '数値リスト  1.', text: '1. 項目1\n2. 項目2\n3. 項目3\n', block: true },
  { group: 'リスト', label: 'タスクリスト  - [ ]', text: '- [ ] タスク1\n- [x] 完了タスク\n', block: true },
  { group: 'ブロック', label: 'コードブロック  ```', text: '```\nコード\n```\n', block: true },
  {
    group: 'ブロック',
    label: '表',
    text: '| 見出しA | 見出しB |\n| --- | --- |\n| セル1 | セル2 |\n| セル3 | セル4 |\n',
    block: true,
  },
];

export const NotepadPage = ({ isGuest }: { isGuest: boolean }) => {
  const { content, saved, onChange, save } = useNotepad(isGuest);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // textarea 内で最後に確定していた選択範囲。プルダウン操作でフォーカスが移っても復元できるようにする。
  const selRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const hadFocusRef = useRef(false);
  // 挿入後にキャレットを移動したい位置。null 以外のとき useEffect が反映する。
  const pendingCaretRef = useRef<number | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    const caret = pendingCaretRef.current;
    if (!el || caret == null) return;
    pendingCaretRef.current = null;
    el.focus();
    el.setSelectionRange(caret, caret);
    selRef.current = { start: caret, end: caret };
  }, [content]);

  const rememberSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    selRef.current = { start: el.selectionStart, end: el.selectionEnd };
    hadFocusRef.current = true;
  };

  const insertSnippet = ({ text, block }: MdSnippet) => {
    // まだ一度も textarea を触っていなければ末尾に挿入する。
    const start = hadFocusRef.current ? selRef.current.start : content.length;
    const end = hadFocusRef.current ? selRef.current.end : content.length;
    // block 記法が行頭以外に入る場合は改行を前置して記法が壊れないようにする。
    const before = content.slice(0, start);
    const prefix = block && before !== '' && !before.endsWith('\n') ? '\n' : '';
    const snippet = prefix + text;
    onChange(before + snippet + content.slice(end));
    pendingCaretRef.current = start + snippet.length;
  };

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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <select
          value=""
          onChange={e => {
            if (e.target.value === '') return;
            const i = Number(e.target.value);
            if (Number.isInteger(i) && MD_SNIPPETS[i]) insertSnippet(MD_SNIPPETS[i]);
          }}
          style={mdSelectStyle}
        >
          <option value="">＋ Markdown 記法を挿入…</option>
          {MD_GROUPS.map(g => (
            <optgroup key={g} label={g}>
              {MD_SNIPPETS.map((s, i) =>
                s.group === g ? (
                  <option key={i} value={i}>{s.label}</option>
                ) : null,
              )}
            </optgroup>
          ))}
        </select>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {content.length.toLocaleString()} 文字
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        onSelect={rememberSelection}
        onKeyUp={rememberSelection}
        onClick={rememberSelection}
        onFocus={rememberSelection}
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

const mdSelectStyle: React.CSSProperties = {
  padding: '8px 6px', borderRadius: 8,
  border: '0.5px solid #d0d0d0',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 13,
};
