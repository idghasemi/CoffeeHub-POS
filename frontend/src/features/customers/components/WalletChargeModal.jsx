import { useEffect, useState } from "react";
import { FaWallet } from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Select from "../../../components/ui/Select.jsx";
import { chargeCustomerWallet } from "../../../services/customer/customerService.js";
import { formatMoney } from "../../../utils/formatters.js";
import { notifyError, notifySuccess } from "../../../utils/notifications.js";
import { parseWalletChargeAmount } from "../walletAmount.js";

function WalletChargeModal({ open, onClose, customer, onCharged }) {
  const [form, setForm] = useState({ amount: "", payment_method: "card_reader", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ amount: "", payment_method: "card_reader", description: "" });
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const amount = parseWalletChargeAmount(form.amount);
    if (amount === null) {
      notifyError(null, "مبلغ شارژ باید یک عدد صحیح و بیشتر از صفر باشد.");
      return;
    }

    setSaving(true);
    try {
      const result = await chargeCustomerWallet(customer.id, {
        amount,
        payment_method: form.payment_method,
        description: form.description || null,
      });
      notifySuccess(`کیف پول ${formatMoney(amount)} شارژ شد.`);
      await onCharged?.(result.customer);
      onClose();
    } catch (error) {
      notifyError(error, "شارژ کیف پول انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="شارژ کیف پول"
      description={customer ? `${customer.full_name} — موجودی فعلی: ${formatMoney(customer.wallet_balance)}` : ""}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button type="submit" form="wallet-charge-form" icon={FaWallet} loading={saving}>
            ثبت شارژ
          </Button>
        </div>
      }
    >
      <form id="wallet-charge-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="مبلغ شارژ (تومان)"
          type="number"
          min="1"
          step="1"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          className="ltr-input"
          inputMode="numeric"
          required
          autoFocus
        />
        <Select
          label="روش دریافت وجه"
          value={form.payment_method}
          onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}
        >
          <option value="card_reader">کارت‌خوان</option>
          <option value="cash">نقدی</option>
          <option value="card_transfer">کارت‌به‌کارت</option>
        </Select>
        <Input
          label="توضیحات"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="اختیاری"
        />
      </form>
    </Modal>
  );
}

export default WalletChargeModal;
