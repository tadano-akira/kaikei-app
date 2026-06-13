import { useState } from 'react';
import { Expense } from './types';
import { useExpenses } from './hooks/useExpenses';
import { useAuth } from './hooks/useAuth';
import { ExpenseList } from './pages/ExpenseList';
import { ExpenseDetail } from './pages/ExpenseDetail';
import { ExpenseForm } from './components/ExpenseForm';
import { LoginPage } from './pages/LoginPage';
import { TodoPage } from './pages/TodoPage';
import { MemoPage } from './pages/MemoPage';
import { NotepadPage } from './pages/NotepadPage';
import { DailyReportPage } from './pages/DailyReportPage';

type Tab = 'expense' | 'todo' | 'memo' | 'notepad' | 'daily';
type Screen =
  | { type: 'list' }
  | { type: 'detail'; expense: Expense }
  | { type: 'new' }
  | { type: 'edit'; expense: Expense };

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const { save, update, remove, groupedByMonth, currentMonthTotal, firestoreLoading } = useExpenses();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const [tab, setTab] = useState<Tab>('expense');

  if (loading) {
    return <Loader text="読み込み中..." />;
  }
  if (!user) {
    return <LoginPage onLogin={login} />;
  }
  if (firestoreLoading) {
    return <Loader text="データを読み込み中..." />;
  }

  const goList = () => setScreen({ type: 'list' });
  const goNew = () => setScreen({ type: 'new' });
  const goDetail = (expense: Expense) => setScreen({ type: 'detail', expense });
  const goEdit = (expense: Expense) => setScreen({ type: 'edit', expense });

  const isExpenseInner = tab === 'expense' && screen.type !== 'list';

  const headerTitle = () => {
    if (tab === 'expense') {
      if (screen.type === 'list') return '経費一覧';
      if (screen.type === 'detail') return '経費詳細';
      if (screen.type === 'new') return '経費を入力';
      if (screen.type === 'edit') return '経費を編集';
    }
    if (tab === 'todo') return 'ToDo';
    if (tab === 'memo') return 'メモ';
    if (tab === 'notepad') return 'テキスト';
    if (tab === 'daily') return '日報';
  };

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        {isExpenseInner ? (
          <button onClick={goList} style={backBtnStyle}>←</button>
        ) : (
          <div style={{ width: 32 }} />
        )}
        <span style={headerTitleStyle}>{headerTitle()}</span>
        {tab === 'expense' && screen.type === 'list' && (
          <button onClick={logout} style={logoutBtnStyle}>ログアウト</button>
        )}
        {tab === 'expense' && screen.type === 'detail' && (
          <button onClick={() => goEdit((screen as { type: 'detail'; expense: Expense }).expense)} style={editIconBtnStyle}>✎</button>
        )}
        {tab !== 'expense' && (
          <button onClick={logout} style={logoutBtnStyle}>ログアウト</button>
        )}
      </header>

      <main style={mainStyle}>
        {tab === 'expense' && screen.type === 'list' && (
          <ExpenseList groupedExpenses={groupedByMonth()} currentMonthTotal={currentMonthTotal()} onAdd={goNew} onSelect={goDetail} />
        )}
        {tab === 'expense' && screen.type === 'detail' && (
          <ExpenseDetail expense={screen.expense} onEdit={() => goEdit(screen.expense)} onDelete={(id) => { remove(id); goList(); }} onBack={goList} />
        )}
        {tab === 'expense' && screen.type === 'new' && (
          <ExpenseForm onSave={(input) => { save(input); goList(); }} onCancel={goList} />
        )}
        {tab === 'expense' && screen.type === 'edit' && (
          <ExpenseForm initial={screen.expense} onSave={(input) => { update(screen.expense.id, input); goList(); }} onCancel={goList} />
        )}
        {tab === 'todo' && <TodoPage />}
        {tab === 'memo' && <MemoPage />}
        {tab === 'notepad' && <NotepadPage />}
        {tab === 'daily' && <DailyReportPage />}
      </main>

      <nav style={navStyle}>
        <NavItem icon="💴" label="経費" active={tab === 'expense'} onClick={() => { setTab('expense'); goList(); }} />
        <NavItem icon="☑" label="ToDo" active={tab === 'todo'} onClick={() => setTab('todo')} />
        <NavItem icon="📝" label="メモ" active={tab === 'memo'} onClick={() => setTab('memo')} />
        <NavItem icon="📄" label="テキスト" active={tab === 'notepad'} onClick={() => setTab('notepad')} />
        <NavItem icon="📋" label="日報" active={tab === 'daily'} onClick={() => setTab('daily')} />
      </nav>
    </div>
  );
}

const Loader = ({ text }: { text: string }) => (
  <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{text}</span>
  </div>
);

const NavItem = ({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    flex: 1, background: 'none', border: 'none', padding: '6px 0 4px', cursor: 'pointer',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
    fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    borderTop: active ? '2px solid var(--color-text-primary)' : '2px solid transparent',
  }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const appStyle: React.CSSProperties = { maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-background-primary)', position: 'relative' };
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', minHeight: 48, gap: 8 };
const headerTitleStyle: React.CSSProperties = { flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'center' };
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px' };
const editIconBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, color: 'var(--color-text-info)', cursor: 'pointer', padding: '0 4px' };
const logoutBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px' };
const mainStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 80 };
const navStyle: React.CSSProperties = { display: 'flex', borderTop: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', position: 'sticky', bottom: 0 };