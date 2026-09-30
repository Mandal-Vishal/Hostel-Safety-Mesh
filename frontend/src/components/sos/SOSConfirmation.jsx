import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function SOSConfirmation({ open, onCancel, onConfirm, sending }) {
  return (
    <Modal open={open} onClose={onCancel} title="Emergency SOS">
      <p className="text-neutral-600 mb-1">
        Are you sure you need immediate assistance?
      </p>
      <p className="text-neutral-600 text-sm mb-4">
        Your hostel safety team will be notified.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={sending}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={sending}>
          {sending ? 'Sending...' : 'Send SOS'}
        </Button>
      </div>
    </Modal>
  )
}