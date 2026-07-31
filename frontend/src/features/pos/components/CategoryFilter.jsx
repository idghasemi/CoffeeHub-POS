import { FaThLarge } from "react-icons/fa";

function CategoryFilter({ categories, selectedId, onSelect }) {
  return (
    <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-black transition ${selectedId === "" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
      >
        <FaThLarge />
        همه محصولات
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(String(category.id))}
          className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-black transition ${String(selectedId) === String(category.id) ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
        >
          {category.title}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
