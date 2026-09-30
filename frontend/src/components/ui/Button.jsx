const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  success: 'bg-success-600 text-white hover:bg-success-500',
  danger: 'bg-danger-600 text-white hover:bg-danger-500',
  outline: 'border border-neutral-200 text-neutral-900 hover:bg-neutral-100',
}

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}