export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-neutral-200 rounded-xl shadow-sm p-4 ${className}`}>
      {children}
    </div>
  )
}
