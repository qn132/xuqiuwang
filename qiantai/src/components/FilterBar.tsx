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
