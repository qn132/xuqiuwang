type TopBarProps = {
  city?: string
  view?: 'square' | 'demands' | 'offers' | 'credit'
  user?: { nickname: string }
  onViewChange?: (view: 'square' | 'demands' | 'offers' | 'credit') => void
  onLogin?: () => void
}

export function TopBar({ city = '北京', view = 'square', user, onViewChange, onLogin }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <div className="brand-badge">需</div>
        <div>
          <div className="brand-title">需求购</div>
          <div className="brand-sub">同城需求撮合平台</div>
        </div>
      </div>

      <nav className="topnav">
        <button className={`nav-btn ${view === 'square' ? 'active' : ''}`} onClick={() => onViewChange?.('square')}>广场</button>
        <button className={`nav-btn ${view === 'demands' ? 'active' : ''}`} onClick={() => onViewChange?.('demands')}>我的需求</button>
        <button className={`nav-btn ${view === 'offers' ? 'active' : ''}`} onClick={() => onViewChange?.('offers')}>我的报价</button>
        <button className={`nav-btn ${view === 'credit' ? 'active' : ''}`} onClick={() => onViewChange?.('credit')}>信用档案</button>
      </nav>

      <div className="user-panel">
        <span className="city-tag">{city}</span>
        <span className="user-name">{user?.nickname}</span>
        <button className="login-btn" onClick={onLogin}>退出</button>
      </div>
    </header>
  )
}
