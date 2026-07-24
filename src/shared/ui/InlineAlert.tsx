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
      ? 'bg-success-bg text-success border-success/20'
      : 'bg-danger-bg text-danger border-danger/20'
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  )
}
