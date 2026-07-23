import type { ReactNode } from 'react'

export function InlineAlert({
  kind = 'success',
  children,
}: {
  kind?: 'success' | 'error'
  children: ReactNode
}) {
  const styles =
    kind === 'success'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200'
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  )
}
