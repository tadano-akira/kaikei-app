interface Props {
  onLogin: () => void;
  onGuest: () => void;
}

export const LoginPage = ({ onLogin, onGuest }: Props) => (
  <div style={{
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 32,
  }}>
    <div style={{ textAlign: 'center' }}>
      <img
        src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
        alt="ひとり帳"
        style={{ width: 80, height: 80, marginBottom: 12, borderRadius: 18 }}
      />
      <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>
        ひとり帳
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        フリーランス向け 簡易会計・売上・ToDo・メモ帳アプリ
      </p>
    </div>

    <button onClick={onLogin} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 24px',
      border: '0.5px solid var(--color-border-secondary)',
      borderRadius: 10,
      background: 'var(--color-background-primary)',
      color: 'var(--color-text-primary)',
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
      </svg>
      Google でログイン
    </button>

    <button onClick={onGuest} style={{
      background: 'none',
      border: 'none',
      fontSize: 13,
      color: 'var(--color-text-secondary)',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: '4px 8px',
    }}>
      ログインせずに試す
    </button>

    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
      ログインすることで、データがクラウドに安全に保存されます
      <br />
      （「ログインせずに試す」はこの端末のみにデータが保存されます）
    </p>
  </div>
);