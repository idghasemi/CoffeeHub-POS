import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBarcode,
  FaBoxes,
  FaEdit,
  FaExclamationTriangle,
  FaFilter,
  FaPlus,
  FaSearch,
  FaTrash,
} from "react-icons/fa";

import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import { getCategories } from "../../services/category/categoryService.js";
import {
  deleteProduct,
  getProducts,
} from "../../services/product/productService.js";
import { formatMoney, formatNumber } from "../../utils/formatters.js";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../utils/notifications.js";
import ProductModal from "./components/ProductModal.jsx";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    stock: "all",
    includeInactive: false,
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [modalState, setModalState] = useState({ open: false, product: null });

  const loadCategories = useCallback(async () => {
    try {
      const result = await getCategories({ include_inactive: true });
      setCategories(result.items || []);
    } catch (error) {
      notifyError(error, "دریافت دسته‌بندی‌ها انجام نشد.");
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        search: appliedFilters.search || undefined,
        category_id: appliedFilters.categoryId || undefined,
        low_stock_only: appliedFilters.stock === "low" || undefined,
        include_inactive: appliedFilters.includeInactive || undefined,
      });
      let items = result.items || [];
      if (appliedFilters.stock === "out") {
        items = items.filter((product) => Number(product.stock) <= 0);
      }
      setProducts(items);
    } catch (error) {
      notifyError(error, "دریافت فهرست محصولات انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const summary = useMemo(
    () =>
      products.reduce(
        (result, product) => {
          if (!product.is_active) {
            result.inactive += 1;
          }
          if (Number(product.stock) <= 0) {
            result.out += 1;
          } else if (Number(product.stock) <= 5) {
            result.low += 1;
          }
          result.inventoryValue += Number(product.cost_price || 0) * Number(product.stock || 0);
          return result;
        },
        { low: 0, out: 0, inactive: 0, inventoryValue: 0 },
      ),
    [products],
  );

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  async function handleDelete(product) {
    const confirmed = await confirmAction({
      title: "غیرفعال کردن محصول؟",
      text: "محصول از صندوق فروش حذف می‌شود؛ اطلاعات آن در فاکتورهای قبلی باقی می‌ماند.",
      confirmText: "غیرفعال شود",
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      notifySuccess("محصول غیرفعال شد.");
      await loadProducts();
    } catch (error) {
      notifyError(error, "غیرفعال کردن محصول انجام نشد.");
    }
  }

  async function handleSaved() {
    await Promise.all([loadProducts(), loadCategories()]);
  }

  return (
    <>
      <PageHeader
        title="محصولات"
        description="مدیریت قیمت، بارکد، موجودی و دسته‌بندی کالاهای قابل فروش"
        actions={
          <Button
            icon={FaPlus}
            onClick={() => setModalState({ open: true, product: null })}
            disabled={!categories.some((category) => category.is_active)}
          >
            محصول جدید
          </Button>
        }
      />

      {!categories.some((category) => category.is_active) ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          برای ثبت محصول، ابتدا حداقل یک دسته‌بندی فعال ایجاد کنید.
        </div>
      ) : null}

      <Card>
        <form
          onSubmit={applyFilters}
          className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_220px_190px_auto]"
        >
          <Input
            icon={FaSearch}
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="جستجو با نام یا بارکد..."
          />
          <Select
            value={filters.categoryId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, categoryId: event.target.value }))
            }
          >
            <option value="">همه دسته‌بندی‌ها</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}{category.is_active ? "" : " (غیرفعال)"}
              </option>
            ))}
          </Select>
          <Select
            value={filters.stock}
            onChange={(event) =>
              setFilters((current) => ({ ...current, stock: event.target.value }))
            }
          >
            <option value="all">همه موجودی‌ها</option>
            <option value="low">کم‌موجودی (۵ یا کمتر)</option>
            <option value="out">ناموجود</option>
          </Select>
          <Button type="submit" variant="secondary" icon={FaFilter}>
            اعمال فیلتر
          </Button>
        </form>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <input
            type="checkbox"
            checked={filters.includeInactive}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                includeInactive: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-blue-600"
          />
          نمایش محصولات غیرفعال
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="slate">نتیجه: {formatNumber(products.length)} محصول</Badge>
          <Badge variant="amber">کم‌موجودی: {formatNumber(summary.low)}</Badge>
          <Badge variant="red">ناموجود: {formatNumber(summary.out)}</Badge>
          <Badge variant="blue">ارزش خرید موجودی: {formatMoney(summary.inventoryValue)}</Badge>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : products.length ? (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-right">محصول</th>
                  <th className="px-5 py-4 text-right">دسته‌بندی</th>
                  <th className="px-5 py-4 text-right">بارکد</th>
                  <th className="px-5 py-4 text-right">قیمت فروش</th>
                  <th className="px-5 py-4 text-right">قیمت خرید</th>
                  <th className="px-5 py-4 text-right">موجودی</th>
                  <th className="px-5 py-4 text-right">وضعیت</th>
                  <th className="px-5 py-4 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = Number(product.stock || 0);
                  return (
                    <tr
                      key={product.id}
                      className="border-t border-slate-100 text-sm hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt=""
                              className="h-11 w-11 rounded-xl border border-slate-200 object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FaBoxes />
                            </span>
                          )}
                          <div>
                            <p className="font-black text-slate-800">{product.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              کد محصول: {formatNumber(product.id)} · واحد: {product.unit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {product.category_title || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {product.barcode ? (
                          <span className="ltr-input inline-flex items-center gap-2 font-mono text-slate-600">
                            <FaBarcode className="text-slate-400" />
                            {product.barcode}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-4 font-black text-emerald-700">
                        {formatMoney(product.price)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatMoney(product.cost_price)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 font-black ${
                            stock <= 0
                              ? "text-red-700"
                              : stock <= 5
                                ? "text-amber-700"
                                : "text-slate-700"
                          }`}
                        >
                          {stock <= 5 ? <FaExclamationTriangle /> : null}
                          {formatNumber(stock)} {product.unit}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={product.is_active ? "green" : "slate"}>
                          {product.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="action-button"
                            title="ویرایش محصول"
                            onClick={() => setModalState({ open: true, product })}
                          >
                            <FaEdit />
                          </button>
                          {product.is_active ? (
                            <button
                              type="button"
                              className="action-button danger"
                              title="غیرفعال کردن محصول"
                              onClick={() => handleDelete(product)}
                            >
                              <FaTrash />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="محصولی مطابق فیلتر پیدا نشد"
            description="فیلترها را تغییر دهید یا محصول جدیدی ثبت کنید."
            action={
              <Button
                icon={FaPlus}
                onClick={() => setModalState({ open: true, product: null })}
                disabled={!categories.some((category) => category.is_active)}
              >
                ثبت محصول
              </Button>
            }
          />
        )}
      </Card>

      <ProductModal
        open={modalState.open}
        product={modalState.product}
        categories={categories}
        onClose={() => setModalState({ open: false, product: null })}
        onSaved={handleSaved}
      />
    </>
  );
}

export default ProductsPage;
