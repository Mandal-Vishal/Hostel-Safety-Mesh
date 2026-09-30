import Button from './Button'

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="text-center py-10">
      <p className="text-danger-600 font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-3">
          Try Again
        </Button>
      )}
    </div>
  )
}