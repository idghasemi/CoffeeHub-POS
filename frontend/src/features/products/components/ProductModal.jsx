import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Select from "../../../components/ui/Select.jsx";
import {
  createProduct,
  updateProduct,
} from "../../../services/product/productService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

const emptyForm = {
  title: "",
  barcode: "",
  category_id: "",
  price: "",
  cost_price: "",
  stock: "",
  unit: "عدد",
  image: "",
  is_active: true,
};

function ProductModal({ open, onClose, product, categories, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      product
        ? {
            title: product.title || "",
            barcode: product.barcode || "",
            category_id: String(product.category_id || ""),
            price: String(product.price ?? ""),
            cost_price: String(product.cost_price ?? ""),
            stock: String(product.stock ?? ""),
            unit: product.unit || "عدد",
            image: product.image || "",
            is_active: product.is_active,
          }
        : {
            ...emptyForm,
            category_id: categories.find((item) => item.is_active)?.id?.toString() || "",
          },
    );
  }, [categories, open, product]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      title: form.title,
      barcode: form.barcode || null,
      category_id: Number(form.category_id),
      price: Number(form.price),
      cost_price: Number(form.cost_price || 0),
      stock: Number(form.stock || 0),
      unit: form.unit,
      image: form.image || null,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      notifySuccess(product ? "محصول ویرایش شد." : "محصول جدید ثبت شد.");
      await onSaved?.();
      onClose();
    } catch (error) {
      notifyError(error, "ذخیره محصول انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "ویرایش محصول" : "محصول جدید"}
      description="قیمت و موجودی ثبت‌شده در این فرم، مرجع قطعی صندوق فروش هستند."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="product-form" icon={FaSave} loading={saving}>ذخیره محصول</Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="نام محصول"
          value={form.title}
          onChange={(event) => setField("title", event.target.value)}
          required
          autoFocus
        />
        <Input
          label="بارکد"
          value={form.barcode}
          onChange={(event) => setField("barcode", event.target.value)}
          className="ltr-input"
          placeholder="اختیاری ولی یکتا"
        />
        <Select
          label="دسته‌بندی"
          value={form.category_id}
          onChange={(event) => setField("category_id", event.target.value)}
          required
        >
          <option value="">انتخاب کنید</option>
          {categories.filter((category) => category.is_active || category.id === product?.category_id).map((category) => (
            <option key={category.id} value={category.id}>{category.title}</option>
          ))}
        </Select>
        <Select label="واحد" value={form.unit} onChange={(event) => setField("unit", event.target.value)}>
          <option value="عدد">عدد</option>
          <option value="لیوان">لیوان</option>
          <option value="بطری">بطری</option>
          <option value="بسته">بسته</option>
          <option value="گرم">گرم</option>
        </Select>
        <Input
          label="قیمت فروش (تومان)"
          type="number"
          min="0"
          step="1000"
          value={form.price}
          onChange={(event) => setField("price", event.target.value)}
          className="ltr-input"
          required
        />
        <Input
          label="قیمت خرید (تومان)"
          type="number"
          min="0"
          step="1000"
          value={form.cost_price}
          onChange={(event) => setField("cost_price", event.target.value)}
          className="ltr-input"
        />
        <Input
          label="موجودی"
          type="number"
          min="0"
          step="0.01"
          value={form.stock}
          onChange={(event) => setField("stock", event.target.value)}
          className="ltr-input"
          required
        />
        <Input
          label="آدرس تصویر"
          value={form.image}
          onChange={(event) => setField("image", event.target.value)}
          className="ltr-input"
          placeholder="https://... (اختیاری)"
        />
        {product ? (
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setField("is_active", event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-bold text-slate-700">محصول در صندوق فعال باشد</span>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}

export default ProductModal;
