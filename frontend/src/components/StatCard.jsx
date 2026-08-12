export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-colors duration-150 hover:border-ink/15">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
