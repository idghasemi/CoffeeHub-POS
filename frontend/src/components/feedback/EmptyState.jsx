import { FaInbox } from "react-icons/fa";

function EmptyState({
  title = "اطلاعاتی وجود ندارد",
  description = "پس از ثبت اطلاعات، نتیجه در این قسمت نمایش داده می‌شود.",
  action,
  compact = false,
  icon: Icon = FaInbox,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "min-h-64"}`}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        <Icon />
      </span>
      <h3 className="font-black text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
