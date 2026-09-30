const variants = {
  neutral: 'bg-neutral-100 text-neutral-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
}

export default function Badge({ children, variant = 'neutral' }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}