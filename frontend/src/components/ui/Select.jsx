function Select({
  label,
  error,
  children,
  className = "",
  containerClassName = "",
  required = false,
  ...props
}) {
  return (
    <label className={`block ${containerClassName}`}>
      {label ? (
        <span className="mb-2 block text-sm font-bold text-slate-700">
          {label}
          {required ? <span className="mr-1 text-red-500">*</span> : null}
        </span>
      ) : null}
      <select
        required={required}
        className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 ${error ? "border-red-400" : "border-slate-200"} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

export default Select;
