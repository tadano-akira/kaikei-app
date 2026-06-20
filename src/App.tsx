import { useState } from 'react';
import { Expense, Sales } from './types';
import { useExpenses } from './hooks/useExpenses';
import { useSales } from './hooks/useSales';
import { useSettings } from './hooks/useSettings';
import { useAuth } from './hooks/useAuth';
import { ExpenseList } from './pages/ExpenseList';
import { ExpenseDetail } from './pages/ExpenseDetail';
import { ExpenseForm } from './components/ExpenseForm';
import { SalesList } from './pages/SalesList';
import { SalesDetail } from './pages/SalesDetail';
import { SalesForm } from './components/SalesForm';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { TodoPage } from './pages/TodoPage';
import { MemoPage } from './pages/MemoPage';
import { NotepadPage } from './pages/NotepadPage';
import { DailyReportPage } from './pages/DailyReportPage';

type Tab = 'expense' | 'dashboard' | 'todo' | 'memo' | 'notepad' | 'daily' | 'settings';
type AccountSubTab = 'expense' | 'sales';

type Screen =
  | { type: 'list' }
  | { type: 'detail'; expense: Expense }
  | { type: 'new' }
  | { type: 'edit'; expense: Expense };

type SalesScreen =
  | { type: 'list' }
  | { type: 'detail'; sales: Sales }
  | { type: 'new' }
  | { type: 'edit'; sales: Sales };

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const { expenses, save: saveExpense, update: updateExpense, remove: removeExpense, groupedByMonth: expenseGrouped, firestoreLoading: expenseLoading } = useExpenses();
  const { sales, save: saveSales, update: updateSales, remove: removeSales, groupedByMonth: salesGrouped, currentMonthTotal: salesMonthTotal, firestoreLoading: salesLoading } = useSales();
  const { settings, loading: settingsLoading, save: saveSettings } = useSettings();

  const [tab, setTab] = useState<Tab>('expense');
  const [subTab, setSubTab] = useState<AccountSubTab>('expense');
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const [salesScreen, setSalesScreen] = useState<SalesScreen>({ type: 'list' });

  if (loading) return <Loader text="読み込み中..." />;
  if (!user) return <LoginPage onLogin={login} />;
  if (tab === 'expense' && (expenseLoading || salesLoading)) return <Loader text="データを読み込み中..." />;

  // 経費ナビゲーション
  const goExpenseList = () => setScreen({ type: 'list' });
  const goExpenseNew = () => setScreen({ type: 'new' });
  const goExpenseDetail = (expense: Expense) => setScreen({ type: 'detail', expense });
  const goExpenseEdit = (expense: Expense) => setScreen({ type: 'edit', expense });

  // 売上ナビゲーション
  const goSalesList = () => setSalesScreen({ type: 'list' });
  const goSalesNew = () => setSalesScreen({ type: 'new' });
  const goSalesDetail = (sales: Sales) => setSalesScreen({ type: 'detail', sales });
  const goSalesEdit = (sales: Sales) => setSalesScreen({ type: 'edit', sales });

  const isExpenseInner = tab === 'expense' && subTab === 'expense' && screen.type !== 'list';
  const isSalesInner = tab === 'expense' && subTab === 'sales' && salesScreen.type !== 'list';
  const isInner = isExpenseInner || isSalesInner;

  const handleBack = () => {
    if (isExpenseInner) goExpenseList();
    if (isSalesInner) goSalesList();
  };

  const headerTitle = () => {
    if (tab === 'expense') {
      if (subTab === 'expense') {
        if (screen.type === 'list') return '経費一覧';
        if (screen.type === 'detail') return '経費詳細';
        if (screen.type === 'new') return '経費を入力';
        if (screen.type === 'edit') return '経費を編集';
      }
      if (subTab === 'sales') {
        if (salesScreen.type === 'list') return '売上一覧';
        if (salesScreen.type === 'detail') return '売上詳細';
        if (salesScreen.type === 'new') return '売上を入力';
        if (salesScreen.type === 'edit') return '売上を編集';
      }
    }
    if (tab === 'dashboard') return '月次ダッシュボード';
    if (tab === 'todo') return 'ToDo';
    if (tab === 'memo') return 'メモ';
    if (tab === 'notepad') return 'テキスト';
    if (tab === 'daily') return '日報';
    if (tab === 'settings') return '設定';
  };

  const showEditBtn =
    (tab === 'expense' && subTab === 'expense' && screen.type === 'detail') ||
    (tab === 'expense' && subTab === 'sales' && salesScreen.type === 'detail');

  const handleEditBtn = () => {
    if (subTab === 'expense' && screen.type === 'detail') goExpenseEdit(screen.expense);
    if (subTab === 'sales' && salesScreen.type === 'detail') goSalesEdit((salesScreen as { type: 'detail'; sales: Sales }).sales);
  };

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        {isInner ? (
          <button onClick={handleBack} style={backBtnStyle}>←</button>
        ) : (
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt="ひとり帳"
            style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
          />
        )}
        <span style={headerTitleStyle}>{headerTitle()}</span>
        {showEditBtn ? (
          <button onClick={handleEditBtn} style={editIconBtnStyle}>✎</button>
        ) : (
          <button onClick={logout} style={logoutBtnStyle}>ログアウト</button>
        )}
      </header>

      {/* 会計サブタブ */}
      {tab === 'expense' && !isInner && (
        <div style={subTabBarStyle}>
          <SubTabItem label="経費" active={subTab === 'expense'} onClick={() => { setSubTab('expense'); goExpenseList(); }} />
          <SubTabItem label="売上" active={subTab === 'sales'} onClick={() => { setSubTab('sales'); goSalesList(); }} />
        </div>
      )}

      <main style={mainStyle}>
        {tab === 'expense' && subTab === 'expense' && screen.type === 'list' && (
          <ExpenseList
            groupedExpenses={expenseGrouped()}
            budget={Math.round(salesMonthTotal() * settings.targetExpenseRate / 100)}
            onAdd={goExpenseNew}
            onSelect={goExpenseDetail}
          />
        )}
        {tab === 'expense' && subTab === 'expense' && screen.type === 'detail' && (
          <ExpenseDetail expense={screen.expense} onEdit={() => goExpenseEdit(screen.expense)} onDelete={(id) => { removeExpense(id); goExpenseList(); }} onBack={goExpenseList} />
        )}
        {tab === 'expense' && subTab === 'expense' && screen.type === 'new' && (
          <ExpenseForm onSave={(input) => { saveExpense(input); goExpenseList(); }} onCancel={goExpenseList} />
        )}
        {tab === 'expense' && subTab === 'expense' && screen.type === 'edit' && (
          <ExpenseForm initial={screen.expense} onSave={(input) => { updateExpense(screen.expense.id, input); goExpenseList(); }} onCancel={goExpenseList} />
        )}

        {tab === 'expense' && subTab === 'sales' && salesScreen.type === 'list' && (
          <SalesList groupedSales={salesGrouped()} onAdd={goSalesNew} onSelect={goSalesDetail} />
        )}
        {tab === 'expense' && subTab === 'sales' && salesScreen.type === 'detail' && (
          <SalesDetail sales={salesScreen.sales} onEdit={() => goSalesEdit(salesScreen.sales)} onDelete={(id) => { removeSales(id); goSalesList(); }} onBack={goSalesList} />
        )}
        {tab === 'expense' && subTab === 'sales' && salesScreen.type === 'new' && (
          <SalesForm onSave={(input) => { saveSales(input); goSalesList(); }} onCancel={goSalesList} />
        )}
        {tab === 'expense' && subTab === 'sales' && salesScreen.type === 'edit' && (
          <SalesForm initial={salesScreen.sales} onSave={(input) => { updateSales(salesScreen.sales.id, input); goSalesList(); }} onCancel={goSalesList} />
        )}

        {tab === 'dashboard' && (
          <DashboardPage expenses={expenses} sales={sales} settings={settings} />
        )}
        {tab === 'todo' && <TodoPage />}
        {tab === 'memo' && <MemoPage />}
        {tab === 'notepad' && <NotepadPage />}
        {tab === 'daily' && <DailyReportPage />}
        {tab === 'settings' && (
          <SettingsPage settings={settings} loading={settingsLoading} onSave={saveSettings} />
        )}
      </main>

      <nav style={navStyle}>
        <NavItem icon="💴" label="会計" active={tab === 'expense'} onClick={() => { setTab('expense'); }} />
        <NavItem icon="📊" label="集計" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
        <NavItem icon="☑" label="ToDo" active={tab === 'todo'} onClick={() => setTab('todo')} />
        <NavItem icon="📝" label="メモ" active={tab === 'memo'} onClick={() => setTab('memo')} />
        <NavItem icon="📄" label="テキスト" active={tab === 'notepad'} onClick={() => setTab('notepad')} />
        <NavItem icon="📋" label="日報" active={tab === 'daily'} onClick={() => setTab('daily')} />
        <NavItem icon="⚙" label="設定" active={tab === 'settings'} onClick={() => setTab('settings')} />
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

const SubTabItem = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    flex: 1, border: 'none', padding: '8px 0', cursor: 'pointer',
    fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-text-primary, #1a1a1a)' : 'var(--color-text-tertiary, #999)',
    background: active ? '#d8d8d8' : 'transparent',
    borderBottom: active ? '2px solid #555' : '2px solid transparent',
    borderRadius: active ? '4px 4px 0 0' : 0,
  }}>
    {label}
  </button>
);

const appStyle: React.CSSProperties = { maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-background-primary)', position: 'relative' };
const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary, #f5f5f5)', minHeight: 48, gap: 8 };
const headerTitleStyle: React.CSSProperties = { flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'center' };
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px' };
const editIconBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, color: 'var(--color-text-info)', cursor: 'pointer', padding: '0 4px' };
const logoutBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 4px' };
const subTabBarStyle: React.CSSProperties = { display: 'flex', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary, #f5f5f5)', padding: '0 16px' };
const mainStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 80 };
const navStyle: React.CSSProperties = { display: 'flex', borderTop: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary, #f5f5f5)', position: 'sticky', bottom: 0 };
