import { useEffect, useState } from "react";
import { FaFileInvoiceDollar, FaWallet } from "react-icons/fa";

import EmptyState from "../../../components/feedback/EmptyState.jsx";
import LoadingState from "../../../components/feedback/LoadingState.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import {
  getCustomerInvoices,
  getCustomerWalletTransactions,
} from "../../../services/customer/customerService.js";
import {
  formatMoney,
  formatPaymentMethod,
  formatPersianDateTime,
} from "../../../utils/formatters.js";
import { notifyError } from "../../../utils/notifications.js";

const transactionLabels = {
  charge: "شارژ",
  purchase: "خرید",
  refund: "بازگشت وجه",
  adjustment: "اصلاح دستی",
};

function CustomerHistoryModal({ open, onClose, customer }) {
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customer) {
      return;
    }

    let active = true;
    async function loadHistory() {
      setLoading(true);
      try {
        const [invoiceResult, transactionResult] = await Promise.all([
          getCustomerInvoices(customer.id),
          getCustomerWalletTransactions(customer.id),
        ]);
        if (active) {
          setInvoices(invoiceResult.items || []);
          setTransactions(transactionResult.items || []);
        }
      } catch (error) {
        notifyError(error, "دریافت سوابق مشتری انجام نشد.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    setActiveTab("invoices");
    loadHistory();
    return () => {
      active = false;
    };
  }, [customer, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`سوابق ${customer?.full_name || "مشتری"}`}
      description={customer ? `شماره تلفن: ${customer.mobile} — موجودی کیف پول: ${formatMoney(customer.wallet_balance)}` : ""}
      size="lg"
    >
      <div className="mb-5 flex gap-2 rounded-xl bg-slate-100 p-1">
        <TabButton active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")} icon={FaFileInvoiceDollar}>
          خریدها ({invoices.length})
        </TabButton>
        <TabButton active={activeTab === "wallet"} onClick={() => setActiveTab("wallet")} icon={FaWallet}>
          گردش کیف پول ({transactions.length})
        </TabButton>
      </div>

      {loading ? (
        <LoadingState />
      ) : activeTab === "invoices" ? (
        invoices.length ? (
          <div className="table-shell custom-scrollbar overflow-x-auto">
            <table className="min-w-[680px]">
              <thead>
                <tr>
                  <th>فاکتور</th>
                  <th>تاریخ و ساعت</th>
                  <th>پرداخت</th>
                  <th>تخفیف</th>
                  <th>مبلغ نهایی</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-black text-blue-700">#{invoice.invoice_number}</td>
                    <td className="text-sm text-slate-600">{formatPersianDateTime(invoice.created_at)}</td>
                    <td>{formatPaymentMethod(invoice.payment_method)}</td>
                    <td>{formatMoney(invoice.discount_amount)}</td>
                    <td className="font-black">{formatMoney(invoice.payable_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="خریدی ثبت نشده است" compact />
        )
      ) : transactions.length ? (
        <div className="table-shell custom-scrollbar overflow-x-auto">
          <table className="min-w-[720px]">
            <thead>
              <tr>
                <th>نوع</th>
                <th>تاریخ و ساعت</th>
                <th>روش</th>
                <th>مبلغ</th>
                <th>مانده بعد از تراکنش</th>
                <th>توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <Badge variant={transaction.amount >= 0 ? "green" : "red"}>
                      {transactionLabels[transaction.transaction_type] || transaction.transaction_type}
                    </Badge>
                  </td>
                  <td className="text-sm text-slate-600">{formatPersianDateTime(transaction.created_at)}</td>
                  <td>{formatPaymentMethod(transaction.payment_method)}</td>
                  <td className={`font-black ${transaction.amount >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {transaction.amount >= 0 ? "+" : ""}{formatMoney(transaction.amount)}
                  </td>
                  <td>{formatMoney(transaction.balance_after)}</td>
                  <td className="max-w-56 truncate text-sm text-slate-500">{transaction.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="گردش کیف پولی ثبت نشده است" compact />
      )}
    </Modal>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${active ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
    >
      <Icon />
      {children}
    </button>
  );
}

export default CustomerHistoryModal;
