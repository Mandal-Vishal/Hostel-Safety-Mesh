export default function Spinner({ className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full h-6 w-6 border-2 border-neutral-200 border-t-primary-600 ${className}`}
    />
  )
}