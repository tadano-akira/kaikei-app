import { useState } from 'react';
import { Expense } from './types';
import { useExpenses } from './hooks/useExpenses';
import { useAuth } from './hooks/useAuth';
import { ExpenseList } from './pages/ExpenseList';
import { ExpenseDetail } from './pages/ExpenseDetail';
import { ExpenseForm } from './components/ExpenseForm';
import { LoginPage } from './pages/LoginPage';

type Screen =
  | { type: 'list' }
  | { type: 'detail'; expense: Expense }
  | { type: 'new' }
  | { type: 'edit'; expense: Expense };

export default function App() {
  // ★ フックはすべてここにまとめる（条件分岐の前）
  const { user, loading, login, logout } = useAuth();
  const { save, update, remove, groupedByMonth, currentMonthTotal, firestoreLoading } = useExpenses();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });

  // ★ 早期returnはフックの後
  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>読み込み中...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  if (firestoreLoading) {
  return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>データを読み込み中...</span>
    </div>
  );
}

  const goList = () => setScreen({ type: 'list' });
  const goNew = () => setScreen({ type: 'new' });
  const goDetail = (expense: Expense) => setScreen({ type: 'detail', expense });
  const goEdit = (expense: Expense) => setScreen({ type: 'edit', expense });

  const screenTitle = (() => {
    if (screen.type === 'list') return '経費一覧';
    if (screen.type === 'detail') return '経費詳細';
    if (screen.type === 'new') return '経費を入力';
    if (screen.type === 'edit') return '経費を編集';
  })();

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        {screen.type !== 'list' && (
          <button onClick={goList} style={backBtnStyle} aria-label="一覧に戻る">←</button>
        )}
        <span style={headerTitleStyle}>{screenTitle}</span>
        {screen.type === 'list' && (
          <button onClick={logout} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px' }}>
            ログアウト
          </button>
        )}
        {screen.type === 'detail' && (
          <button onClick={() => goEdit((screen as { type: 'detail'; expense: Expense }).expense)} style={editIconBtnStyle} aria-label="編集">✎</button>
        )}
      </header>

      <main style={mainStyle}>
        {screen.type === 'list' && (
          <ExpenseList
            groupedExpenses={groupedByMonth()}
            currentMonthTotal={currentMonthTotal()}
            onAdd={goNew}
            onSelect={goDetail}
          />
        )}
        {screen.type === 'detail' && (
          <ExpenseDetail
            expense={screen.expense}
            onEdit={() => goEdit(screen.expense)}
            onDelete={(id) => { remove(id); goList(); }}
            onBack={goList}
          />
        )}
        {screen.type === 'new' && (
          <ExpenseForm
            onSave={(input) => { save(input); goList(); }}
            onCancel={goList}
          />
        )}
        {screen.type === 'edit' && (
          <ExpenseForm
            initial={screen.expense}
            onSave={(input) => { update(screen.expense.id, input); goList(); }}
            onCancel={goList}
          />
        )}
      </main>

      {screen.type === 'list' && (
        <nav style={navStyle}>
          <NavItem icon="☰" label="一覧" active onClick={goList} />
          <NavItem icon="＋" label="入力" onClick={goNew} />
          <NavItem icon="⚙" label="設定" onClick={() => alert('設定画面は今後実装します')} />
        </nav>
      )}
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: {
  icon: string; label: string; active?: boolean; onClick: () => void;
}) => (
  <button onClick={onClick} style={{
    flex: 1, background: 'none', border: 'none', padding: '8px 0 4px', cursor: 'pointer',
    color: active ? 'var(--color-text-info)' : 'var(--color-text-secondary)',
    fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  }}>
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const appStyle: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', height: '100dvh',
  display: 'flex', flexDirection: 'column',
  background: 'var(--color-background-primary)', position: 'relative',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '12px 16px',
  borderBottom: '0.5px solid var(--color-border-tertiary)',
  background: 'var(--color-background-secondary)', minHeight: 48, gap: 8,
};
const headerTitleStyle: React.CSSProperties = {
  flex: 1, fontSize: 15, fontWeight: 500,
  color: 'var(--color-text-primary)', textAlign: 'center',
};
const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 18,
  color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px',
};
const editIconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', fontSize: 18,
  color: 'var(--color-text-info)', cursor: 'pointer', padding: '0 4px',
};
const mainStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 80,
};
const navStyle: React.CSSProperties = {
  display: 'flex', borderTop: '0.5px solid var(--color-border-tertiary)',
  background: 'var(--color-background-secondary)', position: 'sticky', bottom: 0,
};