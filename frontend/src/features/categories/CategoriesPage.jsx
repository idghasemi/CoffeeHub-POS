import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTags, FaTrash } from "react-icons/fa";

import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import {
  deleteCategory,
  getCategories,
} from "../../services/category/categoryService.js";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../utils/notifications.js";
import CategoryModal from "./components/CategoryModal.jsx";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ open: false, category: null });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCategories({ include_inactive: true });
      setCategories(result.items || []);
    } catch (error) {
      notifyError(error, "دریافت دسته‌بندی‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleDelete(category) {
    const linkedCount = Number(category.product_count || 0);
    const confirmed = await confirmAction({
      title: "غیرفعال کردن دسته‌بندی؟",
      text: linkedCount
        ? `این دسته‌بندی ${linkedCount.toLocaleString("fa-IR")} محصول فعال دارد. دسته‌بندی و محصولات آن غیرفعال می‌شوند اما سوابق فاکتورها حفظ خواهد شد.`
        : "دسته‌بندی غیرفعال می‌شود و سوابق قبلی حفظ خواهد شد.",
      confirmText: "غیرفعال شود",
    });
    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteCategory(category.id);
      notifySuccess(
        result.deactivated_products
          ? `دسته‌بندی و ${result.deactivated_products.toLocaleString("fa-IR")} محصول آن غیرفعال شدند.`
          : "دسته‌بندی غیرفعال شد.",
      );
      loadCategories();
    } catch (error) {
      notifyError(error, "غیرفعال کردن دسته‌بندی انجام نشد.");
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="دسته‌بندی محصولات"
        description="ساخت و مدیریت گروه‌هایی که در صندوق فروش نمایش داده می‌شوند"
        actions={
          <Button icon={FaPlus} onClick={() => setModalState({ open: true, category: null })}>
            دسته‌بندی جدید
          </Button>
        }
      />

      <Card>
        <Input
          icon={FaSearch}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جستجوی دسته‌بندی..."
        />
      </Card>

      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : filteredCategories.length ? (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-right">نام دسته‌بندی</th>
                  <th className="px-5 py-4 text-right">محصولات فعال</th>
                  <th className="px-5 py-4 text-right">وضعیت</th>
                  <th className="px-5 py-4 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaTags /></span>
                        <span className="font-black text-slate-800">{category.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold">{Number(category.product_count || 0).toLocaleString("fa-IR")}</td>
                    <td className="px-5 py-4">
                      <Badge variant={category.is_active ? "green" : "slate"}>
                        {category.is_active ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="action-button"
                          title="ویرایش"
                          onClick={() => setModalState({ open: true, category })}
                        >
                          <FaEdit />
                        </button>
                        {category.is_active ? (
                          <button
                            type="button"
                            className="action-button danger"
                            title="غیرفعال کردن"
                            onClick={() => handleDelete(category)}
                          >
                            <FaTrash />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="دسته‌بندی پیدا نشد"
            action={<Button icon={FaPlus} onClick={() => setModalState({ open: true, category: null })}>ثبت دسته‌بندی</Button>}
          />
        )}
      </Card>

      <CategoryModal
        open={modalState.open}
        category={modalState.category}
        onClose={() => setModalState({ open: false, category: null })}
        onSaved={loadCategories}
      />
    </>
  );
}

export default CategoriesPage;
