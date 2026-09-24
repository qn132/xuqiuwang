import type { DemandItem } from '../types/demand'

type DemandListProps = {
  items: DemandItem[]
  selectedId: number | null
  onSelect: (id: number) => void
}

const statusMap: Record<number, string> = {
  0: '待报价',
  1: '已选中供应',
  2: '交易完成',
  3: '已取消',
  4: '已过期',
}

export function DemandList({ items, selectedId, onSelect }: DemandListProps) {
  if (items.length === 0) {
    return <div className="empty-box">暂无需求数据</div>
  }

  return (
    <div className="list-wrap">
      {items.map((item) => (
        <article
          key={item.id}
          className={`demand-card ${selectedId === item.id ? 'active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <div className="card-topline">
            <span className="tag">{item.category}</span>
            <span className={`state ${item.status === 0 ? 'open' : 'pending'}`}>
              {statusMap[item.status] ?? '待报价'}
            </span>
          </div>

          <h3>{item.title}</h3>

          <div className="meta-row">
            <span>预算：¥{item.priceMin} - ¥{item.priceMax}</span>
            <span>交易地：{item.tradeLocation}</span>
          </div>

          <div className="meta-row">
            <span>时间：{item.tradeTime}</span>
            <span>截止：{item.expireTime}</span>
          </div>

          <div className="user-line">
            <strong>{item.user.name}</strong>
            <span>成交 {item.user.deals}</span>
            <span>爽约 {item.user.noShow}</span>
            <span>投诉 {item.user.complaints}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
