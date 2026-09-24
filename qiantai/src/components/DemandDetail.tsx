import { useState } from 'react'
import type { DemandDetail as DemandDetailType } from '../types/demand'

type DemandDetailProps = {
  detail: DemandDetailType | null
  loading?: boolean
  currentUserId?: number
  onSelectOffer?: (offerId: number) => void
  onCancelDemand?: () => void
  onCreateOffer?: (form: { demandId: number; offerPrice: number; remark: string }) => void
  onReportCredit?: (resultType: 1 | 2 | 3) => void
}

const statusMap: Record<number, string> = {
  0: '待报价',
  1: '已选中供应',
  2: '交易完成',
  3: '已取消',
  4: '已过期',
}

export function DemandDetail({ detail, loading = false, currentUserId, onSelectOffer, onCancelDemand, onCreateOffer, onReportCredit }: DemandDetailProps) {
  if (loading) {
    return <div className="detail-card loading-box">正在加载需求详情...</div>
  }

  if (!detail) {
    return <div className="detail-card empty-box">请选择一个需求</div>
  }

  return (
    <>
      <div className="detail-card">
        <div className="detail-header">
          <div>
            <p className="eyebrow">需求详情</p>
            <h2>{detail.title}</h2>
          </div>
          <span className={`state ${detail.status === 0 ? 'open' : 'pending'}`}>
            {statusMap[detail.status] ?? '待报价'}
          </span>
        </div>

        <div className="detail-info">
          <div><label>分类</label><span>{detail.category}</span></div>
          <div><label>预算</label><span>¥{detail.priceMin} - ¥{detail.priceMax}</span></div>
          <div><label>地点</label><span>{detail.tradeLocation}</span></div>
          <div><label>时间</label><span>{detail.tradeTime}</span></div>
        </div>

        <div className="description-box">
          <h4>需求说明</h4>
          <p>{detail.content}</p>
        </div>

        <div className="seller-box">
          <div className="seller-head">
            <strong>{detail.user.name}</strong>
            <span>发单人</span>
          </div>
          <div className="stats-row">
            <span>成交 {detail.user.deals}</span>
            <span>爽约 {detail.user.noShow}</span>
            <span>投诉 {detail.user.complaints}</span>
          </div>
        </div>
        {detail.status === 0 && currentUserId === detail.ownerId && <div className="trade-actions"><strong>需求还在等待报价</strong><button className="danger-btn" type="button" onClick={onCancelDemand}>取消需求</button></div>}
        {detail.status === 1 && currentUserId === detail.ownerId && <div className="trade-actions"><strong>你是需求发布者</strong><button className="select-btn" type="button" onClick={() => onReportCredit?.(1)}>确认交易完成</button><button className="danger-btn" type="button" onClick={() => onReportCredit?.(3)}>登记供应者未按约定完成</button></div>}
        {detail.status === 1 && currentUserId === detail.selectedSupplierId && <div className="trade-actions"><strong>你是已选中的供应者</strong><button className="select-btn" type="button" onClick={() => onReportCredit?.(1)}>确认交易完成</button><button className="danger-btn" type="button" onClick={() => onReportCredit?.(2)}>登记买家爽约</button></div>}
      </div>

      <div className="offer-card">
        <div className="offer-title-row">
          <h3>报价列表</h3>
          <span>{detail.offers.length} 条</span>
        </div>

        {detail.offers.length === 0 ? (
          <div className="empty-box">暂无报价</div>
        ) : (
          detail.offers.map((offer) => (
            <div className="offer-item" key={offer.id}>
              <div className="offer-header">
                <div>
                  <strong>{offer.seller}</strong>
                  <span>{offer.createAt}</span>
                </div>
                <div className="offer-price">¥{offer.offerPrice}</div>
              </div>

              <p>{offer.remark}</p>

              <div className="offer-stats">
                <span>成交 {offer.deals}</span>
                <span>爽约 {offer.noShow}</span>
                <span>投诉 {offer.complaints}</span>
              </div>

              {detail.status === 0 && currentUserId === detail.ownerId && <button className="select-btn" type="button" onClick={() => onSelectOffer?.(offer.id)}>选中接单</button>}
            </div>
          ))
        )}
        {detail.status === 0 && currentUserId !== detail.ownerId && <OfferForm demandId={detail.id} onSubmit={onCreateOffer} />}
      </div>
    </>
  )
}

function OfferForm({ demandId, onSubmit }: { demandId: number; onSubmit?: (form: { demandId: number; offerPrice: number; remark: string }) => void }) {
  const [price, setPrice] = useState('')
  const [remark, setRemark] = useState('')
  return <form className="offer-form" onSubmit={(event) => { event.preventDefault(); if (price) onSubmit?.({ demandId, offerPrice: Number(price), remark }); setPrice(''); setRemark('') }}><h4>提交我的报价</h4><div className="offer-form-row"><input required type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="报价金额" /><input value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="商品情况、可到场时间" /><button className="primary-btn" type="submit">提交报价</button></div></form>
}
