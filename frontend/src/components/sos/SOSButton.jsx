import { useNavigate } from 'react-router-dom'

export default function SOSButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/resident/sos')}
      className="w-40 h-40 rounded-full bg-danger-600 hover:bg-danger-500 text-white flex flex-col items-center justify-center shadow-lg mx-auto transition-colors"
    >
      <span className="text-2xl font-bold">SOS</span>
      <span className="text-xs mt-1">GET HELP NOW</span>
    </button>
  )
}