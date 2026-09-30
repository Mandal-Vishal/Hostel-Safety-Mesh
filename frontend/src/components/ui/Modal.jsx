export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
        {title && <h2 className="text-lg font-bold text-neutral-900 mb-2">{title}</h2>}
        <div>{children}</div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-900"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}