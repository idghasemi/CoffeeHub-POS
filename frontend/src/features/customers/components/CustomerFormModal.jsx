import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Select from "../../../components/ui/Select.jsx";
import {
  createCustomer,
  updateCustomer,
} from "../../../services/customer/customerService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

const emptyForm = {
  first_name: "",
  last_name: "",
  mobile: "",
  gender: "male",
  birth_date: "",
  membership_date: "",
  description: "",
  is_active: true,
};

function CustomerFormModal({ open, onClose, customer, defaultGender = "male", onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      customer
        ? {
            first_name: customer.first_name || "",
            last_name: customer.last_name || "",
            mobile: customer.mobile || "",
            gender: customer.gender || defaultGender,
            birth_date: customer.birth_date || "",
            membership_date: customer.membership_date || "",
            description: customer.description || "",
            is_active: customer.is_active,
          }
        : { ...emptyForm, gender: defaultGender || "male" },
    );
  }, [customer, defaultGender, open]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      birth_date: form.birth_date || null,
      membership_date: form.membership_date || null,
      description: form.description || null,
    };

    try {
      const saved = customer
        ? await updateCustomer(customer.id, payload)
        : await createCustomer(payload);
      notifySuccess(customer ? "اطلاعات مشتری ویرایش شد." : "مشتری جدید ثبت شد.");
      await onSaved?.(saved);
      onClose();
    } catch (error) {
      notifyError(error, "ذخیره مشتری انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "ویرایش مشتری" : "ثبت مشتری جدید"}
      description="اطلاعات اصلی مشتری باشگاه را وارد کنید. شماره تلفن باید یکتا باشد."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" form="customer-form" icon={FaSave} loading={saving}>
            ذخیره مشتری
          </Button>
        </div>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input
          label="نام"
          value={form.first_name}
          onChange={(event) => setField("first_name", event.target.value)}
          required
          autoFocus
        />
        <Input
          label="نام خانوادگی"
          value={form.last_name}
          onChange={(event) => setField("last_name", event.target.value)}
          required
        />
        <Input
          label="شماره تلفن"
          value={form.mobile}
          onChange={(event) => setField("mobile", event.target.value)}
          className="ltr-input"
          inputMode="tel"
          placeholder="09120000000"
          required
        />
        <Select
          label="جنسیت"
          value={form.gender}
          onChange={(event) => setField("gender", event.target.value)}
          required
        >
          <option value="male">آقا</option>
          <option value="female">خانم</option>
        </Select>
        <Input
          label="تاریخ تولد"
          type="date"
          value={form.birth_date}
          onChange={(event) => setField("birth_date", event.target.value)}
          className="ltr-input"
        />
        <Input
          label="تاریخ عضویت"
          type="date"
          value={form.membership_date}
          onChange={(event) => setField("membership_date", event.target.value)}
          className="ltr-input"
          hint="اگر خالی باشد، تاریخ امروز ثبت می‌شود."
        />
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-bold text-slate-700">توضیحات</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            placeholder="توضیحات اختیاری درباره مشتری..."
          />
        </label>
        {customer ? (
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setField("is_active", event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-bold text-slate-700">مشتری فعال باشد</span>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}

export default CustomerFormModal;
