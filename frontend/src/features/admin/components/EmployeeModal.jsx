import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Select from "../../../components/ui/Select.jsx";
import { createEmployee, updateEmployee } from "../../../services/employeeService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

const emptyForm = {
  first_name: "",
  last_name: "",
  phone: "",
  gender: "male",
  position: "باریستا",
  shift: "",
  hire_date: "",
  salary: "",
  description: "",
  is_active: true,
};

function EmployeeModal({ open, employee, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      employee
        ? {
            first_name: employee.first_name || "",
            last_name: employee.last_name || "",
            phone: employee.phone || "",
            gender: employee.gender || "male",
            position: employee.position || "",
            shift: employee.shift || "",
            hire_date: employee.hire_date || "",
            salary: employee.salary == null ? "" : String(employee.salary),
            description: employee.description || "",
            is_active: employee.is_active,
          }
        : emptyForm,
    );
  }, [employee, open]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      gender: form.gender,
      position: form.position,
      shift: form.shift || null,
      hire_date: form.hire_date || null,
      salary: form.salary === "" ? null : Number(form.salary),
      description: form.description || null,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (employee) {
        await updateEmployee(employee.id, payload);
      } else {
        await createEmployee(payload);
      }
      notifySuccess(employee ? "پرونده کارمند ویرایش شد." : "کارمند جدید ثبت شد.");
      await onSaved?.();
      onClose();
    } catch (error) {
      notifyError(error, "ذخیره پرونده کارمند انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? "ویرایش کارمند" : "ثبت کارمند جدید"}
      description="این بخش برای پرونده منابع انسانی است و به‌تنهایی اجازه ورود به سامانه ایجاد نمی‌کند."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="employee-form" icon={FaSave} loading={saving}>ذخیره کارمند</Button>
        </div>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="نام" value={form.first_name} onChange={(event) => setField("first_name", event.target.value)} required autoFocus />
        <Input label="نام خانوادگی" value={form.last_name} onChange={(event) => setField("last_name", event.target.value)} required />
        <Input label="شماره تلفن" value={form.phone} onChange={(event) => setField("phone", event.target.value)} className="ltr-input" inputMode="tel" />
        <Select label="جنسیت" value={form.gender} onChange={(event) => setField("gender", event.target.value)} required><option value="male">آقا</option><option value="female">خانم</option></Select>
        <Input label="سمت شغلی" value={form.position} onChange={(event) => setField("position", event.target.value)} placeholder="مثلاً باریستا" required />
        <Input label="شیفت کاری" value={form.shift} onChange={(event) => setField("shift", event.target.value)} placeholder="مثلاً صبح یا عصر" />
        <Input label="تاریخ استخدام" type="date" value={form.hire_date} onChange={(event) => setField("hire_date", event.target.value)} className="ltr-input" />
        <Input label="حقوق (اختیاری، تومان)" type="number" min="0" step="1000" value={form.salary} onChange={(event) => setField("salary", event.target.value)} className="ltr-input" />
        <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">توضیحات</span><textarea rows={3} value={form.description} onChange={(event) => setField("description", event.target.value)} className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></label>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(event) => setField("is_active", event.target.checked)} className="h-4 w-4 accent-blue-600" /><span className="text-sm font-bold text-slate-700">پرونده کارمند فعال باشد</span></label>
      </form>
    </Modal>
  );
}

export default EmployeeModal;
