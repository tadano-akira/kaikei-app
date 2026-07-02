import { useState } from 'react';
import { useMemos } from '../hooks/useMemos';
import { Memo, MemoCategory } from '../types';

const CAT_LABEL: Record<MemoCategory, string> = { command: 'コマンド', script: 'スクリプト', prompt: 'プロンプト', other: 'その他' };
type Filter = 'all' | MemoCategory;

export const MemoPage = ({ isGuest }: { isGuest: boolean }) => {
  const { memos, add, update, remove } = useMemos(isGuest);
  const [filter, setFilter] = useState<Filter>('all');
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Memo | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MemoCategory>('command');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = filter === 'all' ? memos : memos.filter(m => m.category === filter);

  const openAdd = () => { setEditTarget(null); setTitle(''); setCategory('command'); setBody(''); setModal(true); };
  const openEdit = (m: Memo) => { setEditTarget(m); setTitle(m.title); setCategory(m.category); setBody(m.body); setModal(true); };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (editTarget) {
      await update(editTarget.id, title, category, body);
    } else {
      await add(title, category, body);
    }
    setModal(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: 1 }}>Notes</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>簡易メモ</div>
        </div>
        <button onClick={openAdd} style={addBtnStyle}>＋ メモを追加</button>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'command', 'script', 'prompt', 'other'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 12, cursor: 'pointer',
            background: filter === f ? '#1a1a1a' : 'var(--color-background-secondary)',
            color: filter === f ? '#ffffff' : 'var(--color-text-secondary)',
          }}>
            {f === 'all' ? 'すべて' : CAT_LABEL[f]}
          </button>
        ))}
      </div>

      {/* グリッド */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 40, fontSize: 13 }}>メモがありません</div>
        )}
        {filtered.map(m => (
          <div key={m.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', marginRight: 6 }}>
                  {CAT_LABEL[m.category]}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleCopy(m.body, m.id)} style={iconBtnStyle}>
                  {copied === m.id ? '✅' : 'コピー'}
                </button>
                <button onClick={() => openEdit(m)} style={iconBtnStyle}>編集</button>
                <button onClick={() => remove(m.id)} style={{ ...iconBtnStyle, color: 'var(--color-text-danger)' }}>削除</button>
              </div>
            </div>
            <pre style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '6px 0 0', fontFamily: 'monospace', background: '#f5f5f5', borderRadius: 6, padding: '8px 10px' }}>
              {m.body}
            </pre>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {modal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={modalStyle}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>
              {editTarget ? 'メモを編集' : 'メモを追加'}
            </div>
            <label style={modalLabelStyle}>タイトル</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例: Dockerコンテナ起動" style={modalInputStyle} />
            <label style={modalLabelStyle}>カテゴリ</label>
            <select value={category} onChange={e => setCategory(e.target.value as MemoCategory)} style={modalInputStyle}>
              {(Object.keys(CAT_LABEL) as MemoCategory[]).map(c => (
                <option key={c} value={c}>{CAT_LABEL[c]}</option>
              ))}
            </select>
            <label style={modalLabelStyle}>内容</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="コマンド、スクリプト、プロンプトなど..." style={{ ...modalInputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={() => setModal(false)} style={cancelBtnStyle}>キャンセル</button>
              <button onClick={handleSave} style={saveBtnStyle}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const addBtnStyle: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const cardStyle: React.CSSProperties = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 14px', border: '0.5px solid var(--color-border-tertiary)' };
const iconBtnStyle: React.CSSProperties = { background: '#f5f5f5', border: '0.5px solid #d0d0d0', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: '#555555' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 };
const modalStyle: React.CSSProperties = { background: 'var(--color-background-primary, #ffffff)', borderRadius: 14, padding: 20, width: '100%', maxWidth: 480 };
const modalLabelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, marginTop: 10 };
const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: '#f5f5f5',
  color: '#1a1a1a',
  fontSize: 14,
  boxSizing: 'border-box',
};
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: '9px 0', borderRadius: 8, background: '#f0f0f0', color: '#444444', border: '0.5px solid #d0d0d0', fontSize: 14, cursor: 'pointer' };
const saveBtnStyle: React.CSSProperties = { flex: 2, padding: '9px 0', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };