import { FaBoxOpen, FaPlus } from "react-icons/fa";

import { formatMoney, formatNumber } from "../../../utils/formatters.js";

function ProductGrid({ products, onAdd }) {
  if (!products.length) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <FaBoxOpen className="mb-3 text-4xl text-slate-300" />
        <p className="font-black text-slate-700">محصولی مطابق جستجو پیدا نشد</p>
        <p className="mt-2 text-sm text-slate-500">عبارت جستجو یا دسته‌بندی را تغییر دهید.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const available = Number(product.stock || 0) > 0;
        return (
          <button
            key={product.id}
            type="button"
            disabled={!available}
            onClick={() => onAdd(product)}
            className="group flex min-h-40 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
          >
            <div className="flex flex-1 items-start gap-3 p-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 object-cover"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-blue-600">
                  {product.title?.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 font-black leading-6 text-slate-800">{product.title}</span>
                <span className="mt-1 block text-xs text-slate-500">{product.category_title || "بدون دسته‌بندی"}</span>
                <span className={`mt-2 block text-xs font-bold ${available ? "text-slate-500" : "text-red-600"}`}>
                  {available ? `موجودی: ${formatNumber(product.stock)} ${product.unit}` : "ناموجود"}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
              <strong className="text-sm text-emerald-700">{formatMoney(product.price)}</strong>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition group-hover:bg-blue-700">
                <FaPlus />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default ProductGrid;
