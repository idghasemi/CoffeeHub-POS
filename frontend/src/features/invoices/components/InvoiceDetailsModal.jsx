import {
  FaDownload,
  FaPrint,
  FaReceipt,
} from "react-icons/fa";

import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
  formatGender,
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDateTime,
} from "../../../utils/formatters.js";
import {
  downloadInvoiceJpg,
  printInvoice,
} from "../../../utils/invoiceExport.js";
import { notifyError } from "../../../utils/notifications.js";

function InvoiceDetailsModal({ open, invoice, loading = false, onClose }) {
  function handlePrint() {
    try {
      printInvoice(invoice);
    } catch (error) {
      notifyError(error, "باز کردن پنجره چاپ انجام نشد.");
    }
  }

  function handleJpg() {
    try {
      downloadInvoiceJpg(invoice);
    } catch (error) {
      notifyError(error, "ذخیره تصویر فاکتور انجام نشد.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={invoice ? `جزئیات فاکتور ${invoice.invoice_number || invoice.id}` : "جزئیات فاکتور"}
      description="مبالغ و نام محصولات مطابق اطلاعات ثبت‌شده در زمان فروش نمایش داده می‌شوند."
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>بستن</Button>
          <Button
            variant="secondary"
            icon={FaDownload}
            onClick={handleJpg}
            disabled={!invoice || loading}
          >
            ذخیره JPG
          </Button>
          <Button icon={FaPrint} onClick={handlePrint} disabled={!invoice || loading}>
            چاپ / PDF
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-56 items-center justify-center text-sm font-bold text-slate-500">
          در حال دریافت جزئیات فاکتور...
        </div>
      ) : invoice ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">شماره فاکتور</p>
              <p className="mt-2 font-black text-slate-900">{invoice.invoice_number || invoice.id}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">تاریخ و ساعت شمسی</p>
              <p className="mt-2 font-black text-slate-900">{formatPersianDateTime(invoice.created_at)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">وضعیت</p>
              <div className="mt-2"><Badge variant="green">تکمیل‌شده</Badge></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">مشتری</p>
              <p className="mt-2 font-black text-slate-900">{invoice.customer_name || "—"}</p>
              <p className="mt-1 text-xs text-slate-500">{formatGender(invoice.customer_gender)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">اپراتور صندوق</p>
              <p className="mt-2 font-black text-slate-900">{invoice.operator_name || "—"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">روش پرداخت</p>
              <p className="mt-2 font-black text-slate-900">{formatPaymentMethod(invoice.payment_method)}</p>
            </div>
          </div>

          <div className="custom-scrollbar overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[680px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-right">ردیف</th>
                  <th className="px-4 py-3 text-right">محصول</th>
                  <th className="px-4 py-3 text-right">تعداد</th>
                  <th className="px-4 py-3 text-right">قیمت واحد</th>
                  <th className="px-4 py-3 text-right">جمع</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, index) => (
                  <tr key={item.id || `${item.product_id}-${index}`} className="border-t border-slate-100 text-sm">
                    <td className="px-4 py-3 text-slate-500">{formatNumber(index + 1)}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.product_title}</td>
                    <td className="px-4 py-3">{formatNumber(item.quantity)}</td>
                    <td className="px-4 py-3">{formatMoney(item.unit_price)}</td>
                    <td className="px-4 py-3 font-black text-slate-800">{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mr-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between py-2 text-sm text-slate-600">
              <span>جمع اقلام</span>
              <strong>{formatMoney(invoice.total_amount)}</strong>
            </div>
            <div className="flex items-center justify-between py-2 text-sm text-slate-600">
              <span>تخفیف</span>
              <strong>{formatMoney(invoice.discount_amount)}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between border-t-2 border-slate-900 pt-4 text-lg font-black text-slate-900">
              <span className="inline-flex items-center gap-2"><FaReceipt /> مبلغ نهایی</span>
              <strong>{formatMoney(invoice.payable_amount)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default InvoiceDetailsModal;
