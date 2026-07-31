import { FaSpinner } from "react-icons/fa";

const variantClasses = {
  primary: "border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700",
  secondary: "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
  danger: "border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700",
  ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  success: "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700",
};

const sizeClasses = {
  sm: "h-9 gap-2 rounded-lg px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-base",
};

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center border font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? <FaSpinner className="animate-spin" /> : Icon ? <Icon /> : null}
      {children}
    </button>
  );
}

export default Button;
