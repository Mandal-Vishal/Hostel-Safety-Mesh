import { useState } from 'react'
import Button from '../ui/Button'

const incidentTypes = ['Safety Concern', 'Noise / disturbance', 'Medical', 'Security', 'Other']
const zones = ['Block A • Floor 1', 'Block A • Floor 2', 'Block B • Floor 1', 'Block B • Floor 2']

export default function IncidentForm({ onSubmit, submitting }) {
  const [type, setType] = useState('')
  const [zone, setZone] = useState('')
  const [datetime, setDatetime] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ type, zone, datetime, description, anonymous })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">Incident Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">Select</option>
          {incidentTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">Where did it happen?</label>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          required
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="">Select Zone</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">When did it happen?</label>
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      <div className="bg-neutral-100 rounded-lg p-3">
        <p className="text-sm font-medium text-neutral-900 mb-1">Do you want to remain anonymous?</p>
        <p className="text-xs text-neutral-600 mb-2">
          Your identity will not be shared with staff reviewing this report. Zone-level location may still be included.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Submit anonymously
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  )
}