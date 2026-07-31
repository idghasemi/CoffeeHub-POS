function Input({
  label,
  error,
  hint,
  icon: Icon,
  className = "",
  containerClassName = "",
  required = false,
  inputRef,
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
      <span className="relative block">
        {Icon ? (
          <Icon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        ) : null}
        <input
          ref={inputRef}
          required={required}
          className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 ${Icon ? "pr-11" : ""} ${error ? "border-red-400" : "border-slate-200"} ${className}`}
          {...props}
        />
      </span>
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export default Input;
