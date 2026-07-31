function Card({ children, className = "", padding = true }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export default Card;
