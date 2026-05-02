// This is the SIMPLEST component - no complicated logic

type AlertProps = {
  type: 'error' | 'success'  // TypeScript: only these two values allowed
  message: string
}

export default function Alert({ type, message }: AlertProps) {
  // If no message, show nothing
  if (!message) return null
  
  // Choose emoji and color based on type
  const isError = type === 'error'
  const emoji = isError ? '⚠️' : '✓'
  const bgColor = isError ? 'bg-red-500/10' : 'bg-green-500/10'
  const textColor = isError ? 'text-red-300' : 'text-green-300'
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${bgColor} ${textColor}`}>
      <span>{emoji}</span>
      <span>{message}</span>
    </div>
  )
}