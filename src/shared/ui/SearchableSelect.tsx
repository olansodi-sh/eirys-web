import { useEffect, useRef, useState } from 'react'

export interface SearchableOption {
  id: string
  label: string
  sublabel?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  options: SearchableOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative" ref={rootRef}>
      <input
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        placeholder={placeholder}
        value={isOpen ? query : (selected?.label ?? '')}
        onFocus={() => {
          setIsOpen(true)
          setQuery('')
        }}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-primary-light"
              onClick={() => {
                onChange(o.id)
                setIsOpen(false)
                setQuery('')
              }}
            >
              {o.label}
              {o.sublabel && (
                <span className="ml-1 text-xs text-gray-500">{o.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
