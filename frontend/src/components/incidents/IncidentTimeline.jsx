export default function IncidentTimeline({ events }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-3">
          <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-neutral-900">{event.label}</p>
            <p className="text-xs text-neutral-600">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}