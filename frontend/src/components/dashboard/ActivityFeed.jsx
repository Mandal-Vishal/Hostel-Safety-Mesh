import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'

export default function ActivityFeed({ items }) {
  if (!items || items.length === 0) {
    return <EmptyState title="No recent activity." />
  }

  return (
    <Card>
      <p className="font-semibold text-neutral-900 mb-3">Recent Activity</p>
      <div className="divide-y divide-neutral-200">
        {items.map((item) => (
          <div key={item.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{item.type}</p>
              <p className="text-xs text-neutral-600">{item.detail}</p>
            </div>
            <span className="text-xs text-neutral-600">{item.time}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}