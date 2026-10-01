import Card from '../ui/Card'

export default function StatCard({ label, value, accent = 'neutral' }) {
  const accentColors = {
    neutral: 'text-neutral-900',
    danger: 'text-danger-600',
  }

  return (
    <Card className="text-center">
      <p className="text-xs text-neutral-600 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentColors[accent]}`}>{value}</p>
    </Card>
  )
}