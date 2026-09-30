import { useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'

export default function UIKit() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="min-h-screen p-8 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900">UI Kit</h1>

      <Card>
        <h2 className="font-semibold mb-3">Buttons</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Badges</h2>
        <div className="flex gap-2">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success">Resolved</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Urgent</Badge>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Spinner</h2>
        <Spinner />
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Emergency SOS">
          <p className="text-neutral-600 mb-4">Are you sure you need immediate assistance?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>Send SOS</Button>
          </div>
        </Modal>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Empty State</h2>
        <EmptyState title="No active SOS alerts." description="Everything is currently under control." />
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Error State</h2>
        <ErrorState message="We couldn't load the alerts." onRetry={() => alert('retrying...')} />
      </Card>
    </div>
  )
}