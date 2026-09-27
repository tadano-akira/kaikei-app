import { useEffect, useRef } from 'react';
import { marked } from 'marked';
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

export const NotepadPage = ({ isGuest, previewCss }: { isGuest: boolean; previewCss: string }) => {
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

  const handlePreview = () => {
    const bodyHtml = marked.parse(content, { async: false }) as string;
    // 同じウィンドウ名を指定することで、開きっぱなしのプレビュー窓を使い回す。
    const w = window.open('', 'notepad-preview', 'width=820,height=900');
    if (!w) {
      alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
      return;
    }
    w.document.open();
    w.document.write(buildPreviewHtml(bodyHtml, previewCss));
    w.document.close();
    w.focus();
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
          <button onClick={handlePreview} style={btnStyle}>プレビュー</button>
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

// <style> はHTML上の raw text 要素のため、中に "</style" という文字列が現れると
// そこでタグが終了したとみなされてしまう。ユーザー定義CSSにも起こりうるので分断しておく。
const escapeStyleContent = (css: string) => css.replace(/<\/style/gi, '<\\/style');

const buildPreviewHtml = (bodyHtml: string, customCss: string) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Markdown Preview</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 24px 32px 64px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif;
    line-height: 1.75; color: #1a1a1a; background: #ffffff;
    max-width: 760px; margin-left: auto; margin-right: auto;
  }
  h1, h2, h3, h4 { line-height: 1.4; margin: 1.4em 0 0.5em; }
  h1 { font-size: 1.6em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
  h2 { font-size: 1.35em; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em; }
  h3 { font-size: 1.15em; }
  h4 { font-size: 1em; }
  p { margin: 0.8em 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f0f0f0; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f5f5f5; border: 0.5px solid #d0d0d0; border-radius: 8px; padding: 12px 14px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 0.8em 0; padding: 0.2em 1em; border-left: 4px solid #d0d0d0; color: #555; }
  hr { border: none; border-top: 1px solid #d0d0d0; margin: 2em 0; }
  table { border-collapse: collapse; margin: 1em 0; width: 100%; }
  th, td { border: 1px solid #d0d0d0; padding: 6px 10px; text-align: left; }
  th { background: #f5f5f5; }
  ul, ol { padding-left: 1.6em; }
  li { margin: 0.25em 0; }
  input[type="checkbox"] { margin-right: 0.4em; }
  @media (prefers-color-scheme: dark) {
    body { color: #e6e6e6; background: #1a1a1a; }
    code { background: #2a2a2a; }
    pre { background: #222; border-color: #3a3a3a; }
    th { background: #242424; }
    th, td { border-color: #3a3a3a; }
    h1, h2 { border-color: #333; }
    blockquote { color: #aaa; border-color: #444; }
  }
</style>
${customCss.trim() ? `<style id="notepad-custom-css">\n${escapeStyleContent(customCss)}\n</style>` : ''}
</head>
<body>
${bodyHtml}
</body>
</html>`;
