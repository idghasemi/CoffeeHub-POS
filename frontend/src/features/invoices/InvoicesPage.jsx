import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEye,
  FaFileInvoiceDollar,
  FaFilter,
  FaSearch,
} from "react-icons/fa";

import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import {
  getInvoice,
  getInvoices,
} from "../../services/invoice/invoiceService.js";
import {
  daysAgoIso,
  formatGender,
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDateTime,
  todayIso,
} from "../../utils/formatters.js";
import { notifyError } from "../../utils/notifications.js";
import InvoiceDetailsModal from "./components/InvoiceDetailsModal.jsx";

const initialFilters = {
  search: "",
  dateFrom: daysAgoIso(30),
  dateTo: todayIso(),
  gender: "",
  paymentMethod: "",
};

function InvoicesPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailsState, setDetailsState] = useState({ open: false, invoice: null, loading: false });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInvoices({
        search: appliedFilters.search || undefined,
        date_from: appliedFilters.dateFrom,
        date_to: appliedFilters.dateTo,
        gender: appliedFilters.gender || undefined,
        payment_method: appliedFilters.paymentMethod || undefined,
        page_size: 200,
      });
      setInvoices(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      notifyError(error, "دریافت فاکتورها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const totals = useMemo(
    () =>
      invoices.reduce(
        (result, invoice) => {
          result.amount += Number(invoice.payable_amount || 0);
          result.discount += Number(invoice.discount_amount || 0);
          return result;
        },
        { amount: 0, discount: 0 },
      ),
    [invoices],
  );

  function applyFilters(event) {
    event.preventDefault();
    if (filters.dateTo < filters.dateFrom) {
      notifyError(null, "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      return;
    }
    setAppliedFilters({ ...filters });
  }

  async function openDetails(invoiceId) {
    setDetailsState({ open: true, invoice: null, loading: true });
    try {
      const invoice = await getInvoice(invoiceId);
      setDetailsState({ open: true, invoice, loading: false });
    } catch (error) {
      notifyError(error, "دریافت جزئیات فاکتور انجام نشد.");
      setDetailsState({ open: false, invoice: null, loading: false });
    }
  }

  return (
    <>
      <PageHeader
        title="فاکتورها"
        description="تمام فروش‌ها با نام مشتری، اپراتور و تاریخ و ساعت شمسی"
      />

      <Card>
        <form onSubmit={applyFilters} className="grid gap-3 xl:grid-cols-6">
          <Input
            label="جستجو"
            icon={FaSearch}
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="نام مشتری یا شماره فاکتور"
            containerClassName="xl:col-span-2"
          />
          <Input
            label="از تاریخ"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
            className="ltr-input"
            required
          />
          <Input
            label="تا تاریخ"
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
            className="ltr-input"
            required
          />
          <Select
            label="جنسیت مشتری"
            value={filters.gender}
            onChange={(event) => setFilters((current) => ({ ...current, gender: event.target.value }))}
          >
            <option value="">همه</option>
            <option value="male">آقایان</option>
            <option value="female">بانوان</option>
          </Select>
          <Select
            label="روش پرداخت"
            value={filters.paymentMethod}
            onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}
          >
            <option value="">همه</option>
            <option value="cash">نقدی</option>
            <option value="card_reader">کارت‌خوان</option>
            <option value="card_transfer">کارت‌به‌کارت</option>
            <option value="wallet">کیف پول</option>
          </Select>
          <div className="xl:col-span-6 flex justify-end">
            <Button type="submit" icon={FaFilter} variant="secondary">اعمال فیلتر</Button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="slate">تعداد: {formatNumber(total)} فاکتور</Badge>
          <Badge variant="green">مجموع فروش نتایج: {formatMoney(totals.amount)}</Badge>
          <Badge variant="amber">مجموع تخفیف: {formatMoney(totals.discount)}</Badge>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : invoices.length ? (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-right">شماره فاکتور</th>
                  <th className="px-5 py-4 text-right">تاریخ و ساعت شمسی</th>
                  <th className="px-5 py-4 text-right">مشتری</th>
                  <th className="px-5 py-4 text-right">جنسیت</th>
                  <th className="px-5 py-4 text-right">اپراتور</th>
                  <th className="px-5 py-4 text-right">روش پرداخت</th>
                  <th className="px-5 py-4 text-right">تخفیف</th>
                  <th className="px-5 py-4 text-right">مبلغ نهایی</th>
                  <th className="px-5 py-4 text-right">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                    <td className="px-5 py-4 font-black text-blue-700">{invoice.invoice_number || invoice.id}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700">{formatPersianDateTime(invoice.created_at)}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{invoice.customer_name}</td>
                    <td className="px-5 py-4">
                      <Badge variant={invoice.customer_gender === "female" ? "violet" : "blue"}>{formatGender(invoice.customer_gender)}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{invoice.operator_name || "—"}</td>
                    <td className="px-5 py-4">{formatPaymentMethod(invoice.payment_method)}</td>
                    <td className="px-5 py-4 text-amber-700">{formatMoney(invoice.discount_amount)}</td>
                    <td className="px-5 py-4 font-black text-emerald-700">{formatMoney(invoice.payable_amount)}</td>
                    <td className="px-5 py-4">
                      <button type="button" className="action-button" title="مشاهده، چاپ یا ذخیره JPG" onClick={() => openDetails(invoice.id)}><FaEye /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FaFileInvoiceDollar}
            title="فاکتوری در این بازه پیدا نشد"
            description="بازه تاریخ یا سایر فیلترها را تغییر دهید."
          />
        )}
      </Card>

      <InvoiceDetailsModal
        open={detailsState.open}
        invoice={detailsState.invoice}
        loading={detailsState.loading}
        onClose={() => setDetailsState({ open: false, invoice: null, loading: false })}
      />
    </>
  );
}

export default InvoicesPage;
