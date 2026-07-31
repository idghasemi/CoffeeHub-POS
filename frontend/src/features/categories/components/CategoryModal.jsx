import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
  createCategory,
  updateCategory,
} from "../../../services/category/categoryService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

function CategoryModal({ open, onClose, category, onSaved }) {
  const [title, setTitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(category?.title || "");
      setIsActive(category?.is_active ?? true);
    }
  }, [category, open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (category) {
        await updateCategory(category.id, { title, is_active: isActive });
      } else {
        await createCategory({ title, is_active: true });
      }
      notifySuccess(category ? "دسته‌بندی ویرایش شد." : "دسته‌بندی جدید ثبت شد.");
      await onSaved?.();
      onClose();
    } catch (error) {
      notifyError(error, "ذخیره دسته‌بندی انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="category-form" icon={FaSave} loading={saving}>ذخیره</Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="نام دسته‌بندی"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثلاً نوشیدنی گرم"
          required
          autoFocus
        />
        {category ? (
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-bold text-slate-700">دسته‌بندی فعال باشد</span>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}

export default CategoryModal;
