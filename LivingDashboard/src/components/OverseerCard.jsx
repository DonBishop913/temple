export default function OverseerCard({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/70 p-4 shadow">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}
