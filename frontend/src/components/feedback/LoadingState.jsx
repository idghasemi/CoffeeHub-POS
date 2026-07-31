import { FaSpinner } from "react-icons/fa";

function LoadingState({ label = "در حال دریافت اطلاعات...", compact = false }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-slate-500 ${compact ? "py-5" : "min-h-56"}`}
    >
      <FaSpinner className="animate-spin text-blue-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default LoadingState;
