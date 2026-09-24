/**
 * 分类筛选栏
 *
 * 通过点击分类筛选需求列表，方便用户快速筛选同类需求。
 */
type FilterBarProps = {
  categories: string[]
  selectedCategory: string
  onSelect: (category: string) => void
}

export function FilterBar({ categories, selectedCategory, onSelect }: FilterBarProps) {
  return (
    <div className="filter-card">
      <div className="filter-header">
        <span>筛选分类</span>
        <button type="button">地区：北京</button>
      </div>

      <div className="chip-group">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`chip ${selectedCategory === category ? 'selected' : ''}`}
            onClick={() => onSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}
