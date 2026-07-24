import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100',
    danger: 'bg-white text-danger border border-danger hover:bg-danger-bg',
    ghost: 'text-gray-500 hover:bg-gray-100',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Input({
  label,
  className = '',
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <input
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

export function Select({
  label,
  children,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <select
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-lg border border-gray-300 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'lg',
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl'
}) {
  if (!open) return null
  const widths: Record<string, string> = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${widths[size]} rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-300 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-sm text-gray-500">{message}</div>
  )
}
