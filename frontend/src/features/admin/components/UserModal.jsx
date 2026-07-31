import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Select from "../../../components/ui/Select.jsx";
import { createUser, updateUser } from "../../../services/userService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

const emptyForm = {
  username: "",
  full_name: "",
  role: "men_shift_supervisor",
  password: "",
  is_active: true,
};

function UserModal({ open, user, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(
      user
        ? {
            username: user.username || "",
            full_name: user.full_name || "",
            role: user.role || "men_shift_supervisor",
            password: "",
            is_active: user.is_active,
          }
        : emptyForm,
    );
  }, [open, user]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user && form.password.length < 4) {
      notifyError(null, "رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }

    setSaving(true);
    try {
      let saved;
      if (user) {
        saved = await updateUser(user.id, {
          username: form.username,
          full_name: form.full_name,
          role: form.role,
          is_active: form.is_active,
        });
      } else {
        saved = await createUser({
          username: form.username,
          full_name: form.full_name,
          role: form.role,
          password: form.password,
          is_active: form.is_active,
        });
      }
      notifySuccess(user ? "حساب کاربری ویرایش شد." : "حساب کاربری جدید ساخته شد.");
      await onSaved?.(saved);
      onClose();
    } catch (error) {
      notifyError(error, "ذخیره حساب کاربری انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? "ویرایش حساب کاربری" : "حساب کاربری جدید"}
      description="حساب کاربری برای ورود به سامانه است و با پرونده کارمند تفاوت دارد."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="user-form" icon={FaSave} loading={saving}>ذخیره حساب</Button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Input label="نام و نام خانوادگی" value={form.full_name} onChange={(event) => setField("full_name", event.target.value)} required autoFocus />
        <Input label="نام کاربری" value={form.username} onChange={(event) => setField("username", event.target.value)} className="ltr-input" autoComplete="off" required />
        <Select label="نقش دسترسی" value={form.role} onChange={(event) => setField("role", event.target.value)} required>
          <option value="admin">مدیر سامانه</option>
          <option value="men_shift_supervisor">سرپرست شیفت آقایان</option>
          <option value="women_shift_supervisor">سرپرست شیفت بانوان</option>
        </Select>
        {!user ? (
          <Input label="رمز عبور اولیه" type="password" value={form.password} onChange={(event) => setField("password", event.target.value)} className="ltr-input" minLength={4} autoComplete="new-password" required />
        ) : (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-800">
            برای تغییر رمز این حساب، از دکمه کلید در جدول کاربران استفاده کنید.
          </div>
        )}
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:col-span-2">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setField("is_active", event.target.checked)} className="h-4 w-4 accent-blue-600" />
          <span className="text-sm font-bold text-slate-700">امکان ورود این حساب فعال باشد</span>
        </label>
      </form>
    </Modal>
  );
}

export default UserModal;
