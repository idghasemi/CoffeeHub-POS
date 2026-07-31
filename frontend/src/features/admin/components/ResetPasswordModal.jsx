import { useEffect, useState } from "react";
import { FaKey } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import { resetUserPassword } from "../../../services/userService.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";

function ResetPasswordModal({ open, user, onClose }) {
  const [form, setForm] = useState({ password: "", confirmation: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ password: "", confirmation: "" });
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password.length < 4) {
      notifyError(null, "رمز جدید باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    if (form.password !== form.confirmation) {
      notifyError(null, "تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }

    setSaving(true);
    try {
      await resetUserPassword(user.id, form.password);
      notifySuccess(`رمز عبور «${user.username}» تغییر کرد.`);
      onClose();
    } catch (error) {
      notifyError(error, "تغییر رمز کاربر انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تعیین رمز عبور جدید"
      description={user ? `حساب ${user.full_name} (${user.username}) — نشست‌های فعلی این کاربر بسته می‌شوند.` : ""}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="reset-password-form" icon={FaKey} loading={saving}>تغییر رمز</Button>
        </div>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="رمز عبور جدید" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="ltr-input" minLength={4} autoComplete="new-password" required autoFocus />
        <Input label="تکرار رمز عبور جدید" type="password" value={form.confirmation} onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))} className="ltr-input" minLength={4} autoComplete="new-password" required />
      </form>
    </Modal>
  );
}

export default ResetPasswordModal;
