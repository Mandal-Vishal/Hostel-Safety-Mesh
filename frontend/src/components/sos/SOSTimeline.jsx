import { SOS_STATUSES, getStatusLabel } from '../../utils/sosStatus'

export default function SOSTimeline({ currentStatus }) {
  const currentIndex = SOS_STATUSES.indexOf(currentStatus)

  return (
    <div className="space-y-0">
      {SOS_STATUSES.map((status, index) => {
        const reached = index <= currentIndex
        const isLast = index === SOS_STATUSES.length - 1

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  reached ? 'bg-danger-600' : 'bg-neutral-200'
                }`}
              />
              {!isLast && (
                <span className={`w-0.5 flex-1 min-h-6 ${reached ? 'bg-danger-600' : 'bg-neutral-200'}`} />
              )}
            </div>
            <p
              className={`text-sm pb-6 ${
                reached ? 'text-neutral-900 font-medium' : 'text-neutral-600'
              }`}
            >
              {getStatusLabel(status)}
            </p>
          </div>
        )
      })}
    </div>
  )
}