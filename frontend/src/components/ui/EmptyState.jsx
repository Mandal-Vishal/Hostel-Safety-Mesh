export default function EmptyState({ title, description }) {
  return (
    <div className="text-center py-10 text-neutral-600">
      <p className="font-medium text-neutral-900">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  )
}