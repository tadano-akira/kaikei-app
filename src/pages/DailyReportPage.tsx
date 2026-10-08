import { useMemo, useState } from 'react';
import { useDailyReports } from '../hooks/useDailyReports';
import { useSettings } from '../hooks/useSettings';
import { DailyReport, DailyReportItem } from '../types';
import { reportItems, reportTotalHours } from '../lib/dailyReport';
import { downloadDailyReportCsv } from '../lib/dailyReportCsv';
import { TIME_OPTIONS } from '../lib/timeOptions';

const ITEM_SUGGESTIONS_ID = 'daily-report-item-suggestions';
const MAX_ITEM_SUGGESTIONS = 50;

const todayStr = () => new Date().toISOString().slice(0, 10);
const thisMonthStr = () => todayStr().slice(0, 7);
const formatDate = (s: string) => { const [y, m, d] = s.split('-'); return `${y}年${m}月${d}日`; };
const formatHours = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(2).replace(/0$/, '')}h`;

// 入力中の箇条書き1行。hours は入力欄の文字列のまま保持する。
interface ItemDraft {
  key: string;
  content: string;
  hours: string;
}

const newKey = () => crypto.randomUUID();
const emptyItem = (): ItemDraft => ({ key: newKey(), content: '', hours: '' });

export const DailyReportPage = ({ isGuest }: { isGuest: boolean }) => {
  const { reports, save, remove } = useDailyReports(isGuest);
  const { settings } = useSettings(isGuest);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyReport | null>(null);
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [plan, setPlan] = useState('');
  const [note, setNote] = useState('');
  const [workStartTime, setWorkStartTime] = useState('');
  const [workEndTime, setWorkEndTime] = useState('');
  const [breakHours, setBreakHours] = useState('');
  const [csvMonth, setCsvMonth] = useState(thisMonthStr());

  // 過去の作業内容を新しい順に重複なく並べたサジェスト候補。
  const contentSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const r of reports) {
      for (const i of reportItems(r)) {
        if (!seen.has(i.content)) {
          seen.add(i.content);
          list.push(i.content);
        }
      }
    }
    return list.slice(0, MAX_ITEM_SUGGESTIONS);
  }, [reports]);

  const openAdd = () => {
    setEditTarget(null);
    setDate(todayStr());
    setItems([emptyItem()]);
    setPlan('');
    setNote('');
    setWorkStartTime(settings.dailyReportDefaultStartTime ?? '');
    setWorkEndTime('');
    setBreakHours('');
    setModal(true);
  };

  const openEdit = (r: DailyReport) => {
    setEditTarget(r);
    setDate(r.date);
    const drafts = reportItems(r).map(i => ({
      key: newKey(),
      content: i.content,
      hours: i.hours != null ? String(i.hours) : '',
    }));
    setItems(drafts.length > 0 ? drafts : [emptyItem()]);
    setPlan(r.plan);
    setNote(r.note);
    setWorkStartTime(r.workStartTime ?? '');
    setWorkEndTime(r.workEndTime ?? '');
    setBreakHours(r.breakHours != null ? String(r.breakHours) : '');
    setModal(true);
  };

  const updateItem = (key: string, patch: Partial<ItemDraft>) => {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, ...patch } : i)));
  };

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key));
  };

  const handleSave = async () => {
    if (!date) return;
    const payload: DailyReportItem[] = items
      .filter(i => i.content.trim() !== '')
      .map(i => ({ content: i.content.trim(), hours: i.hours !== '' ? Number(i.hours) : null }));
    await save(
      {
        date,
        items: payload,
        plan,
        note,
        workStartTime: workStartTime || null,
        workEndTime: workEndTime || null,
        breakHours: breakHours !== '' ? Number(breakHours) : null,
      },
      editTarget?.id,
    );
    setModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: 1 }}>Daily Report</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>日報</div>
        </div>
        <button onClick={openAdd} style={addBtnStyle}>＋ 日報を書く</button>
      </div>

      <div style={csvBarStyle}>
        <input type="month" value={csvMonth} onChange={e => setCsvMonth(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
        <button
          onClick={() => downloadDailyReportCsv(reports, csvMonth)}
          disabled={!csvMonth}
          style={{ ...csvBtnStyle, opacity: csvMonth ? 1 : 0.5, cursor: csvMonth ? 'pointer' : 'default' }}
        >
          CSVダウンロード
        </button>
      </div>

      {reports.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 40, fontSize: 13 }}>日報がありません</div>
      )}
      {reports.map(r => {
        const rItems = reportItems(r);
        const totalHours = reportTotalHours(r);
        return (
          <div key={r.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{formatDate(r.date)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(r)} style={iconBtnStyle}>編集</button>
                <button onClick={() => remove(r.id)} style={{ ...iconBtnStyle, color: 'var(--color-text-danger)' }}>削除</button>
              </div>
            </div>
            {(r.workStartTime || r.workEndTime || r.breakHours != null) && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                🕒 {r.workStartTime ?? '－'}〜{r.workEndTime ?? '－'}
                {r.breakHours != null && `（休憩 ${r.breakHours}h）`}
              </div>
            )}
            {rItems.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                  ✅ 今日やったこと{totalHours > 0 && `（合計 ${formatHours(totalHours)}）`}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-text-primary)' }}>
                  {rItems.map((i, idx) => (
                    <li key={idx}>
                      {i.content}
                      {i.hours != null && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>{formatHours(i.hours)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.plan && <Section label="📋 明日やること" body={r.plan} />}
            {r.note && <Section label="💬 所感・メモ" body={r.note} />}
          </div>
        );
      })}

      {modal && (
        <div style={overlayStyle} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={modalStyle}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 14 }}>
              {editTarget ? '日報を編集' : '日報を書く'}
            </div>
            <label style={labelStyle}>日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>業務開始時間（任意）</label>
                <select value={workStartTime} onChange={e => setWorkStartTime(e.target.value)} style={inputStyle}>
                  <option value="">未入力</option>
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>業務終了時間（任意）</label>
                <select value={workEndTime} onChange={e => setWorkEndTime(e.target.value)} style={inputStyle}>
                  <option value="">未入力</option>
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={labelStyle}>休憩時間（任意・単位: h）</label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={24}
              step={0.25}
              value={breakHours}
              onChange={e => setBreakHours(e.target.value)}
              placeholder="例: 1"
              style={inputStyle}
            />

            <label style={labelStyle}>今日やったこと（箇条書き・稼働時間）</label>
            <datalist id={ITEM_SUGGESTIONS_ID}>
              {contentSuggestions.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {items.map(item => (
              <div key={item.key} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>・</span>
                <input
                  type="text"
                  value={item.content}
                  onChange={e => updateItem(item.key, { content: e.target.value })}
                  placeholder="作業内容"
                  maxLength={500}
                  list={ITEM_SUGGESTIONS_ID}
                  style={{ ...inputStyle, flex: 1, width: 'auto' }}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={24}
                  step={0.25}
                  value={item.hours}
                  onChange={e => updateItem(item.key, { hours: e.target.value })}
                  placeholder="h"
                  aria-label="稼働時間（h）"
                  style={{ ...inputStyle, width: 72, flex: 'none' }}
                />
                <button onClick={() => removeItem(item.key)} style={removeItemBtnStyle} aria-label="項目を削除">×</button>
              </div>
            ))}
            <button onClick={() => setItems(prev => [...prev, emptyItem()])} style={addItemBtnStyle}>＋ 項目を追加</button>

            <label style={labelStyle}>明日やること</label>
            <textarea value={plan} onChange={e => setPlan(e.target.value)} rows={3} placeholder="明日の予定・タスク..." style={{ ...inputStyle, resize: 'vertical' }} />
            <label style={labelStyle}>所感・メモ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="気づき、課題、その他..." style={{ ...inputStyle, resize: 'vertical' }} />

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

const Section = ({ label, body }: { label: string; body: string }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{body}</div>
  </div>
);

const csvBarStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 };
const csvBtnStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, background: '#f0f0f0', color: '#333333', border: '0.5px solid #d0d0d0', fontSize: 13, fontWeight: 500 };
const addBtnStyle: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, background: '#1a1a1a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const cardStyle: React.CSSProperties = { background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px', marginBottom: 10, border: '0.5px solid var(--color-border-tertiary)' };
const iconBtnStyle: React.CSSProperties = { background: '#f5f5f5', border: '0.5px solid #d0d0d0', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer', color: '#555555' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, marginTop: 10 };
const inputStyle: React.CSSProperties = {
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
const removeItemBtnStyle: React.CSSProperties = { flex: 'none', width: 28, height: 28, borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: '0.5px solid #fca5a5', fontSize: 14, cursor: 'pointer' };
const addItemBtnStyle: React.CSSProperties = { width: '100%', padding: '7px 0', borderRadius: 8, background: '#f0f0f0', color: '#444444', border: '0.5px dashed #bdbdbd', fontSize: 13, cursor: 'pointer' };

const modalStyle: React.CSSProperties = {
  background: 'var(--color-background-primary, #ffffff)',
  borderRadius: 14,
  padding: 20,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90dvh',
  overflowY: 'auto',
};
