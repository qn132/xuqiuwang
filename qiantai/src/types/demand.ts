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
