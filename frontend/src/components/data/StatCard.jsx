function StatCard({ title, value, subtitle, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
          {subtitle ? <p className="mt-2 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ${tones[tone]}`}>
            <Icon />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export default StatCard;
