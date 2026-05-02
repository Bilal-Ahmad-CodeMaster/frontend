export default function Field({
  label,
  error,
  children
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7685]">
        {label}
      </label>

      {children}

      {error && (
        <span className="text-[11px] text-red-400">
          {error}
        </span>
      )}
    </div>
  )
}