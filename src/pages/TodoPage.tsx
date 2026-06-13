import { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { Priority } from '../types';

const PRIORITY_LABEL: Record<Priority, string> = { high: '高', medium: '中', low: '低' };
const PRIORITY_COLOR: Record<Priority, string> = {
  high: 'var(--color-text-danger)',
  medium: 'var(--color-text-warning)',
  low: 'var(--color-text-secondary)',
};

type Filter = 'all' | 'active' | 'done' | 'high';

export const TodoPage = () => {
  const { todos, add, toggle, remove } = useTodos();
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    if (filter === 'high') return t.priority === 'high' && !t.done;
    return true;
  });

  const handleAdd = async () => {
    if (!text.trim()) return;
    await add(text.trim(), priority);
    setText('');
  };

  const remaining = todos.filter(t => !t.done).length;

  return (
    <div>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={labelStyle}>Tasks</div>
          <div style={titleStyle}>ToDoリスト</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
          残り {remaining} 件 / 合計 {todos.length} 件
        </div>
      </div>

      {/* 入力エリア */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="新しいタスクを入力..."
          style={inputStyle}
        />
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={selectStyle}>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <button onClick={handleAdd} style={addBtnStyle}>追加</button>
      </div>

      {/* フィルター */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['all', 'active', 'done', 'high'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...filterBtnStyle,
            background: filter === f ? '#1a1a1a' : 'var(--color-background-secondary)',
            color: filter === f ? '#ffffff' : 'var(--color-text-secondary)',
          }}>
            {{ all: 'すべて', active: '未完了', done: '完了済み', high: '優先度：高' }[f]}
          </button>
        ))}
      </div>

      {/* リスト */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 40, fontSize: 13 }}>
          タスクがありません
        </div>
      )}
      {filtered.map(todo => (
        <div key={todo.id} style={todoRowStyle}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggle(todo.id, !todo.done)}
            style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{
            flex: 1, fontSize: 14,
            color: todo.done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
            textDecoration: todo.done ? 'line-through' : 'none',
          }}>
            {todo.text}
          </span>
          <span style={{ fontSize: 11, color: PRIORITY_COLOR[todo.priority], fontWeight: 500, flexShrink: 0 }}>
            {PRIORITY_LABEL[todo.priority]}
          </span>
          <button onClick={() => remove(todo.id)} style={deleteBtnStyle}>✕</button>
        </div>
      ))}
    </div>
  );
};

const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 };
const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: 1 };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' };
const inputStyle: React.CSSProperties = { flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 14 };
const selectStyle: React.CSSProperties = { padding: '8px 6px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13 };
const addBtnStyle: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 };
const filterBtnStyle: React.CSSProperties = { padding: '4px 12px', borderRadius: 20, border: 'none', fontSize: 12, cursor: 'pointer' };
const todoRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: 14, flexShrink: 0 };