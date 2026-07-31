import {
  FaCashRegister,
  FaMinus,
  FaPlus,
  FaReceipt,
  FaShoppingBasket,
  FaTrash,
} from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { formatMoney, formatNumber } from "../../../utils/formatters.js";

const paymentMethods = [
  { value: "card_reader", label: "کارت‌خوان" },
  { value: "cash", label: "نقدی" },
  { value: "card_transfer", label: "کارت‌به‌کارت" },
  { value: "wallet", label: "کیف پول" },
];

function CartPanel({
  items,
  subtotal,
  discount,
  onDiscountChange,
  payable,
  selectedCustomer,
  paymentMethod,
  onPaymentMethodChange,
  onIncrement,
  onDecrement,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
  processing,
}) {
  const walletInsufficient =
    paymentMethod === "wallet" &&
    Number(selectedCustomer?.wallet_balance || 0) < Number(payable || 0);

  return (
    <aside className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-0 xl:max-h-[calc(100vh-8.5rem)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaShoppingBasket /></span>
          <div>
            <h2 className="font-black text-slate-900">سبد سفارش</h2>
            <p className="mt-0.5 text-xs text-slate-500">{formatNumber(items.length)} قلم متفاوت</p>
          </div>
        </div>
        {items.length ? (
          <button type="button" className="action-button danger" title="پاک کردن سبد" onClick={onClear}>
            <FaTrash />
          </button>
        ) : null}
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.product.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{item.product.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatMoney(item.product.price)} × {formatNumber(item.quantity)}</p>
                  </div>
                  <button type="button" className="text-slate-400 transition hover:text-red-600" title="حذف" onClick={() => onRemove(item.product.id)}>
                    <FaTrash />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button type="button" className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50" onClick={() => onDecrement(item.product.id)}><FaMinus className="text-xs" /></button>
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(event) => onQuantityChange(item.product.id, event.target.value)}
                      className="h-9 w-12 border-x border-slate-200 text-center text-sm font-black outline-none"
                    />
                    <button type="button" className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50" onClick={() => onIncrement(item.product.id)}><FaPlus className="text-xs" /></button>
                  </div>
                  <strong className="text-sm text-slate-900">{formatMoney(Number(item.product.price) * Number(item.quantity))}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <FaShoppingBasket className="mb-3 text-5xl text-slate-200" />
            <p className="font-black text-slate-600">سبد سفارش خالی است</p>
            <p className="mt-2 max-w-xs text-xs leading-6 text-slate-400">روی محصولات کلیک کنید یا بارکد را اسکن کنید.</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-600"><span>جمع اقلام</span><strong>{formatMoney(subtotal)}</strong></div>
          <Input
            label="تخفیف (تومان)"
            type="number"
            min="0"
            max={subtotal}
            step="1000"
            value={discount}
            onChange={(event) => onDiscountChange(event.target.value)}
            className="ltr-input"
            disabled={!items.length}
          />
          <div className="flex items-center justify-between border-t-2 border-slate-900 pt-3 text-lg font-black text-slate-900">
            <span className="inline-flex items-center gap-2"><FaReceipt /> قابل پرداخت</span>
            <strong>{formatMoney(payable)}</strong>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => {
            const disabled = method.value === "wallet" && !selectedCustomer;
            return (
              <button
                key={method.value}
                type="button"
                disabled={disabled}
                onClick={() => onPaymentMethodChange(method.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${paymentMethod === method.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}
              >
                {method.label}
              </button>
            );
          })}
        </div>

        {paymentMethod === "wallet" && selectedCustomer ? (
          <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${walletInsufficient ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            موجودی کیف پول: {formatMoney(selectedCustomer.wallet_balance)}
            {walletInsufficient ? " — موجودی برای این خرید کافی نیست." : ""}
          </div>
        ) : null}

        <Button
          size="lg"
          icon={FaCashRegister}
          loading={processing}
          disabled={!selectedCustomer || !items.length || walletInsufficient}
          onClick={onCheckout}
          className="mt-4 w-full"
        >
          ثبت نهایی فروش
        </Button>
      </div>
    </aside>
  );
}

export default CartPanel;
