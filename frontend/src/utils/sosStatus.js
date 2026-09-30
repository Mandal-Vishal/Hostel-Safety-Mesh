export const SOS_STATUSES = ['TRIGGERED', 'ACKNOWLEDGED', 'RESPONDING', 'ON_SCENE', 'RESOLVED']

export function getStatusMessage(status) {
  switch (status) {
    case 'TRIGGERED':
      return 'Your safety team has been notified.'
    case 'ACKNOWLEDGED':
      return 'Your warden has received your request. Help is on the way.'
    case 'RESPONDING':
      return 'Security staff is responding.'
    case 'ON_SCENE':
      return 'Help has arrived.'
    case 'RESOLVED':
      return 'This incident has been resolved.'
    default:
      return ''
  }
}

export function getStatusLabel(status) {
  return status.replace('_', ' ')
}