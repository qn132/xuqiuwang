/**
 * 需求购前端入口
 *
 * 功能概览：
 * - 处理用户登录与退出
 * - 展示需求广场、我的需求、我的报价、信用档案等页面
 * - 调用后端接口实现需求创建、报价、选中报价与信用记录提交
 */
import { useEffect, useState } from 'react'
import { cancelDemand, createDemand, createOffer, getCreditRecords, getDemandDetail, getDemandList, getMyDemands, getMyOffers, getStats, login, reportCredit, selectOffer } from './api/requestApi'
import type { DemandDetail as DemandDetailType, DemandItem } from './types/demand'
import { DemandDetail } from './components/DemandDetail'
import { DemandList } from './components/DemandList'
import { FilterBar } from './components/FilterBar'
import { TopBar } from './components/TopBar'

const categories = ['全部', '日用百货', '数码电子', '家居家具', '服饰配件', '其他']
type View = 'square' | 'demands' | 'offers' | 'credit'
type User = { id: number; phone: string; nickname: string; avatar: string; credit_score: number }

function App() {
  const [user, setUser] = useState<User | null>(() => JSON.parse(sessionStorage.getItem('qiugouwang_user') || 'null'))
  const [view, setView] = useState<View>('square')
  const [phone, setPhone] = useState('13800002917')
  const [loginOpen, setLoginOpen] = useState(!sessionStorage.getItem('qiugouwang_token'))
  const [publishOpen, setPublishOpen] = useState(false)
  const [category, setCategory] = useState('全部')
  const [items, setItems] = useState<DemandItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<DemandDetailType | null>(null)
  const [offers, setOffers] = useState<Array<{ id: number; demandId: number; title: string; offerPrice: number; remark: string; isSelected: number; status: number; createAt: string }>>([])
  const [myDemands, setMyDemands] = useState<DemandItem[]>([])
  const [records, setRecords] = useState<Array<{ id: number; demandId: number; type: number; desc: string; evidenceImg: string; createAt: string }>>([])
  const [stats, setStats] = useState({ deals: 0, noShow: 0, complaints: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const refreshSquare = async () => {
    setLoading(true)
    try {
      const list = await getDemandList({ city: '北京', page: 1, size: 50 })
      setItems(list)
      if (!selectedId && list[0]) setSelectedId(list[0].id)
    } catch (error) { setMessage(error instanceof Error ? error.message : '获取需求失败') } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!user) return
    refreshSquare()
    getStats().then(setStats).catch(() => undefined)
  }, [user])

  useEffect(() => {
    if (!selectedId || view !== 'square') return
    getDemandDetail(selectedId).then(setDetail).catch((error) => setMessage(error instanceof Error ? error.message : '获取详情失败'))
  }, [selectedId, view])

  const doLogin = async () => {
    try {
      const result = await login(phone)
      sessionStorage.setItem('qiugouwang_token', result.token)
      sessionStorage.setItem('qiugouwang_user', JSON.stringify(result.userInfo))
      setUser(result.userInfo)
      setLoginOpen(false)
      setMessage('登录成功')
    } catch (error) { setMessage(error instanceof Error ? error.message : '登录失败') }
  }

  const loadOffers = async () => { setOffers((await getMyOffers()).list) }
  const loadDemands = async () => { setMyDemands((await getMyDemands()).list.map((item) => ({ ...item, user: { name: user!.nickname, deals: 0, noShow: 0, complaints: 0 } }))) }
  const loadCredit = async () => { setRecords((await getCreditRecords(user!.id)).list) }
  const changeView = (next: View) => {
    setView(next)
    if (next === 'offers') loadOffers().catch((error) => setMessage(error.message))
    if (next === 'demands') loadDemands().catch((error) => setMessage(error.message))
    if (next === 'credit') loadCredit().catch((error) => setMessage(error.message))
  }

  if (!user || loginOpen) return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="brand-badge">需</div><p className="eyebrow">同城需求撮合平台</p>
        <h1>先登录，再一起把需求办成</h1>
        <p className="muted">手机号登录即注册，所有交易在线下完成，平台只记录撮合和信用。</p>
        <label>手机号<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="请输入 11 位手机号" /></label>
        <button className="primary-btn wide-btn" type="button" onClick={doLogin}>进入需求购</button>
        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  )

  return <div className="page-shell">
    <TopBar city="北京" view={view} user={user} onViewChange={changeView} onLogin={() => { sessionStorage.clear(); setUser(null); setLoginOpen(true) }} />
    {message && <div className="toast" onClick={() => setMessage('')}>{message}</div>}
    {view === 'square' && <main className="content-grid">
      <section className="left-panel">
        <div className="hero-card"><div><p className="eyebrow">同城线下交易</p><h1>买家发布需求，卖家主动报价接单</h1></div><button className="primary-btn" type="button" onClick={() => setPublishOpen(true)}>发布需求</button></div>
        <FilterBar categories={categories} selectedCategory={category} onSelect={setCategory} />
        {loading ? <div className="loading-box">正在加载需求数据...</div> : <DemandList items={category === '全部' ? items : items.filter((item) => item.category === category)} selectedId={selectedId} onSelect={setSelectedId} />}
      </section>
      <aside className="right-panel"><DemandDetail detail={detail} loading={!detail && loading} currentUserId={user.id} onSelectOffer={async (offerId) => { await selectOffer(detail!.id, offerId); setMessage('已选中报价'); setDetail(await getDemandDetail(detail!.id)); }} onCancelDemand={async () => { if (!window.confirm('确定取消这条需求吗？')) return; await cancelDemand(detail!.id); setMessage('需求已取消'); await refreshSquare(); setDetail(await getDemandDetail(detail!.id)); }} onCreateOffer={async (form) => { await createOffer(form); setMessage('报价成功'); setDetail(await getDemandDetail(form.demandId)) }} onReportCredit={async (resultType) => { const description = resultType === 1 ? '按约定地点完成交易，商品符合描述' : resultType === 2 ? '买家未按约定时间地点到场' : '供应者未按约定提供商品或完成交易'; const result = await reportCredit(detail!.id, resultType, description); setMessage(result.completed ? '双方已确认，交易完成' : '已确认，等待另一方确认'); setStats(await getStats()); setDetail(await getDemandDetail(detail!.id)); }} /></aside>
    </main>}
    {view === 'offers' && <section className="workspace-section"><div className="section-heading"><div><p className="eyebrow">供应者工作台</p><h1>我的报价</h1></div><button className="secondary-btn" onClick={() => changeView('square')}>回到需求广场</button></div>{offers.length === 0 ? <div className="empty-box">还没有报价，去广场看看附近的需求。</div> : <div className="data-list">{offers.map((offer) => <article className="data-row clickable-row" key={offer.id} onClick={() => { setSelectedId(offer.demandId); changeView('square') }}><div><strong>{offer.title}</strong><p>{offer.remark || '未填写备注'}</p><small>点击查看订单详情</small></div><b>¥{offer.offerPrice}</b><span className={`state ${offer.status === 2 || offer.status === 1 && offer.isSelected ? 'open' : 'pending'}`}>{offer.status === 2 ? '已完成' : offer.status === 1 && offer.isSelected ? '已选中' : offer.status === 3 ? '已取消' : offer.status === 4 ? '已过期' : '等待回复'}</span></article>)}</div>}</section>}
    {view === 'demands' && <section className="workspace-section"><div className="section-heading"><div><p className="eyebrow">买家工作台</p><h1>我的需求</h1></div><button className="primary-btn" onClick={() => setPublishOpen(true)}>发布新需求</button></div>{myDemands.length === 0 ? <div className="empty-box">还没有发布需求。</div> : <div className="data-list">{myDemands.map((item) => <article className="data-row" key={item.id} onClick={() => { setSelectedId(item.id); changeView('square') }}><div><strong>{item.title}</strong><p>{item.tradeLocation} · {item.tradeTime || '时间待定'}</p></div><span className={`state ${item.status === 0 ? 'open' : 'pending'}`}>{item.status === 0 ? '等待报价' : item.status === 1 ? '已选供应' : item.status === 2 ? '已完成' : '已关闭'}</span></article>)}</div>}</section>}
    {view === 'credit' && <section className="workspace-section"><div className="section-heading"><div><p className="eyebrow">履约记录</p><h1>我的信用档案</h1></div><div className="stats-row big-stats"><span>成交 {stats.deals}</span><span>爽约 {stats.noShow}</span><span>投诉 {stats.complaints}</span></div></div>{records.length === 0 ? <div className="empty-box">完成一次交易后，信用记录会显示在这里。</div> : <div className="data-list">{records.map((record) => <article className="data-row" key={record.id}><div><strong>{record.type === 1 ? '正常履约' : record.type === 2 ? '买家爽约' : '卖家商品问题'}</strong><p>{record.desc}</p></div><span>{record.createAt}</span></article>)}</div>}</section>}
    {publishOpen && <PublishModal onClose={() => setPublishOpen(false)} onSubmit={async (form) => { await createDemand(form); setPublishOpen(false); setMessage('需求发布成功'); await refreshSquare() }} />}
  </div>
}

function PublishModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: { title: string; category: string; priceMin: number; priceMax: number; content: string; tradeLocation: string; tradeTime: string; expireHour: number; city: string }) => Promise<void> }) {
  const [form, setForm] = useState({ title: '', category: '日用百货', priceMin: 0, priceMax: 0, content: '', tradeLocation: '', tradeTime: '', expireHour: 48, city: '北京' })
  const set = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }))
  return <div className="modal-backdrop"><form className="modal-panel" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}><div className="section-heading"><h2>发布一条新需求</h2><button type="button" className="icon-btn" onClick={onClose}>×</button></div><label>需求标题<input required value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="例如：求购家用不锈钢汤勺 2 把" /></label><div className="form-grid"><label>分类<select value={form.category} onChange={(event) => set('category', event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>城市<input required value={form.city} onChange={(event) => set('city', event.target.value)} /></label><label>预算最低<input type="number" min="0" value={form.priceMin} onChange={(event) => set('priceMin', Number(event.target.value))} /></label><label>预算最高<input type="number" min="0" value={form.priceMax} onChange={(event) => set('priceMax', Number(event.target.value))} /></label><label>交易地点<input required value={form.tradeLocation} onChange={(event) => set('tradeLocation', event.target.value)} /></label><label>期望时间<input value={form.tradeTime} onChange={(event) => set('tradeTime', event.target.value)} placeholder="例如：周六 17:00-19:00" /></label></div><label>详细描述<textarea required rows={4} value={form.content} onChange={(event) => set('content', event.target.value)} /></label><label>有效期（小时）<input type="number" min="1" value={form.expireHour} onChange={(event) => set('expireHour', Number(event.target.value))} /></label><button className="primary-btn wide-btn" type="submit">发布需求</button></form></div>
}

export default App
