export type DemandStatus = 0 | 1 | 2 | 3 | 4

export type UserSummary = {
  name: string
  deals: number
  noShow: number
  complaints: number
}

export type Offer = {
  id: number
  seller: string
  offerPrice: number
  remark: string
  createAt: string
  deals: number
  noShow: number
  complaints: number
}

export type DemandItem = {
  id: number
  title: string
  category: string
  priceMin: number
  priceMax: number
  tradeLocation: string
  tradeTime: string
  status: DemandStatus
  createAt: string
  expireTime: string
  user: UserSummary
}

export type DemandDetail = DemandItem & {
  content: string
  ownerId?: number
  selectedSupplierId?: number
  offers: Offer[]
}

type ApiEnvelope<T> = {
  code?: number
  msg?: string
  data?: T
}

const getToken = () => localStorage.getItem('qiugouwang_token') ?? ''

async function request<T>(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(url, { ...options, headers })
  const payload = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || payload.code !== 200) throw new Error(payload.msg ?? '请求失败')
  return payload.data as T
}

export type LoginResult = { token: string; userInfo: UserInfo }
export type UserInfo = { id: number; phone: string; nickname: string; avatar: string; credit_score: number }
export type Stats = { deals: number; noShow: number; complaints: number }
export type DemandForm = { title: string; category: string; priceMin: number; priceMax: number; content: string; tradeLocation: string; tradeTime: string; expireHour: number; city: string }
export type OfferForm = { demandId: number; offerPrice: number; remark: string }

export async function login(phone: string) {
  return request<LoginResult>('/api/v1/user/login', { method: 'POST', body: JSON.stringify({ phone }) })
}

export async function createDemand(form: DemandForm) {
  return request<{ demandId: number }>('/api/v1/demand/create', { method: 'POST', body: JSON.stringify(form) })
}

export async function createOffer(form: OfferForm) {
  return request<{}>('/api/v1/offer/create', { method: 'POST', body: JSON.stringify(form) })
}

export async function selectOffer(demandId: number, offerId: number) {
  return request<{}>('/api/v1/demand/selectOffer', { method: 'PUT', body: JSON.stringify({ demandId, offerId }) })
}

export async function cancelDemand(demandId: number) {
  return request<{}>(`/api/v1/demand/cancel/${demandId}`, { method: 'PUT' })
}

export async function reportCredit(demandId: number, resultType: 1 | 2 | 3, desc: string) {
  return request<{}>('/api/v1/credit/report', { method: 'POST', body: JSON.stringify({ demandId, resultType, desc, evidenceImg: [] }) })
}

export async function getStats() {
  return request<Stats>('/api/v1/user/stats')
}

export async function getMyOffers() {
  return request<{ list: Array<{ id: number; demandId: number; title: string; offerPrice: number; remark: string; isSelected: number; status: number; createAt: string }> }>('/api/v1/offer/myList')
}

export async function getMyDemands() {
  return request<{ list: Array<any> }>('/api/v1/demand/myList')
}

export async function getCreditRecords(userId: number) {
  return request<{ list: Array<{ id: number; demandId: number; type: number; desc: string; evidenceImg: string; createAt: string }> }>(`/api/v1/credit/list/${userId}`)
}

const normalizeUser = (user: any): UserSummary => ({
  name: user?.name ?? user?.nickname ?? '匿名用户',
  deals: Number(user?.deals ?? 0),
  noShow: Number(user?.noShow ?? 0),
  complaints: Number(user?.complaints ?? 0),
})

const normalizeOffer = (offer: any): Offer => ({
  id: Number(offer?.id ?? 0),
  seller: offer?.seller ?? offer?.supplierName ?? '供应商',
  offerPrice: Number(offer?.offerPrice ?? offer?.offer_price ?? 0),
  remark: offer?.remark ?? '',
  createAt: offer?.createAt ?? offer?.create_time ?? '',
  deals: Number(offer?.deals ?? 0),
  noShow: Number(offer?.noShow ?? 0),
  complaints: Number(offer?.complaints ?? 0),
})

const normalizeDemandItem = (item: any): DemandItem => ({
  id: Number(item?.id ?? 0),
  title: item?.title ?? '',
  category: item?.category ?? '其他',
  priceMin: Number(item?.priceMin ?? item?.price_min ?? 0),
  priceMax: Number(item?.priceMax ?? item?.price_max ?? 0),
  tradeLocation: item?.tradeLocation ?? item?.trade_location ?? '',
  tradeTime: item?.tradeTime ?? item?.trade_time ?? '',
  status: Number(item?.status ?? 0) as DemandStatus,
  createAt: item?.createAt ?? item?.create_time ?? '',
  expireTime: item?.expireTime ?? item?.expire_time ?? '',
  user: normalizeUser(item?.user),
})

const normalizeDemandDetail = (detail: any): DemandDetail => ({
  ...normalizeDemandItem(detail),
  content: detail?.content ?? '',
  ownerId: Number(detail?.ownerId ?? detail?.owner_id ?? 0) || undefined,
  selectedSupplierId: Number(detail?.selectedSupplierId ?? 0) || undefined,
  offers: Array.isArray(detail?.offers) ? detail.offers.map(normalizeOffer) : [],
})

export async function getDemandList(params: {
  city?: string
  category?: string
  page?: number
  size?: number
  signal?: AbortSignal
} = {}) {
  const search = new URLSearchParams()

  if (params.city) search.set('city', params.city)
  if (params.category) search.set('category', params.category)
  if (params.page) search.set('page', String(params.page))
  if (params.size) search.set('size', String(params.size))

  const url = `/api/v1/demand/list${search.toString() ? `?${search.toString()}` : ''}`

  const data = await request<any>(url, { method: 'GET', signal: params.signal }) ?? {}
  const list = Array.isArray(data.list) ? data.list : Array.isArray(data) ? data : []

  return list.map(normalizeDemandItem)
}

export async function getDemandDetail(demandId: number, signal?: AbortSignal) {
  const data = await request<any>(`/api/v1/demand/detail/${demandId}`, { method: 'GET', signal })
  return normalizeDemandDetail(data)
}
