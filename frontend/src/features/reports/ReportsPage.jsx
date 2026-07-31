import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChartBar,
  FaFileInvoiceDollar,
  FaFilter,
  FaMars,
  FaPrint,
  FaReceipt,
  FaVenus,
} from "react-icons/fa";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import StatCard from "../../components/data/StatCard.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { getSalesReport } from "../../services/reportService.js";
import {
  daysAgoIso,
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDate,
  formatShortPersianDate,
  todayIso,
} from "../../utils/formatters.js";
import { notifyError } from "../../utils/notifications.js";
import { printSalesReport } from "../../utils/reportExport.js";

function ReportsPage() {
  const [filters, setFilters] = useState({ dateFrom: daysAgoIso(30), dateTo: todayIso() });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      setReport(
        await getSalesReport({
          date_from: appliedFilters.dateFrom,
          date_to: appliedFilters.dateTo,
        }),
      );
    } catch (error) {
      notifyError(error, "دریافت گزارش فروش انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const gender = useMemo(() => {
    const result = { male: { invoice_count: 0, amount: 0 }, female: { invoice_count: 0, amount: 0 } };
    for (const item of report?.gender_breakdown || []) {
      if (result[item.gender]) {
        result[item.gender] = item;
      }
    }
    return result;
  }, [report]);

  function applyFilters(event) {
    event.preventDefault();
    if (filters.dateTo < filters.dateFrom) {
      notifyError(null, "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
      return;
    }
    setAppliedFilters({ ...filters });
  }

  function handlePrint() {
    try {
      printSalesReport(report);
    } catch (error) {
      notifyError(error, "باز کردن گزارش برای چاپ انجام نشد.");
    }
  }

  if (loading && !report) {
    return <LoadingState />;
  }

  const summary = report?.summary || {};

  return (
    <>
      <PageHeader
        title="گزارش‌ها"
        description="تحلیل تعداد و مبلغ فروش در بازه زمانی انتخابی، تفکیک‌شده بر اساس جنسیت مشتری"
        actions={
          <Button icon={FaPrint} onClick={handlePrint} disabled={!report || loading}>
            چاپ / ذخیره PDF
          </Button>
        }
      />

      <Card>
        <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
          <Button type="submit" icon={FaFilter} variant="secondary" loading={loading}>
            بروزرسانی گزارش
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          بازه فعال: {formatPersianDate(report?.date_from)} تا {formatPersianDate(report?.date_to)}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="جمع فروش" value={formatMoney(summary.total_amount)} subtitle="مبلغ نهایی فاکتورها" icon={FaChartBar} tone="green" />
        <StatCard title="تعداد فاکتور" value={formatNumber(summary.invoice_count)} subtitle="فاکتور تکمیل‌شده" icon={FaFileInvoiceDollar} tone="blue" />
        <StatCard title="میانگین هر فاکتور" value={formatMoney(summary.average_invoice_amount)} subtitle="فروش متوسط" icon={FaReceipt} tone="violet" />
        <StatCard title="جمع تخفیف" value={formatMoney(summary.total_discount)} subtitle="تخفیف اعمال‌شده" icon={FaReceipt} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between">
            <div><p className="font-black text-slate-900">فروش مشتریان آقا</p><p className="mt-1 text-xs text-slate-500">تعداد فاکتور و مجموع مبلغ</p></div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700"><FaMars /></span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <strong className="text-2xl font-black text-blue-800">{formatMoney(gender.male.amount)}</strong>
            <span className="text-sm font-black text-slate-600">{formatNumber(gender.male.invoice_count)} فاکتور</span>
          </div>
        </Card>
        <Card className="border-fuchsia-200 bg-fuchsia-50/40">
          <div className="flex items-center justify-between">
            <div><p className="font-black text-slate-900">فروش مشتریان خانم</p><p className="mt-1 text-xs text-slate-500">تعداد فاکتور و مجموع مبلغ</p></div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-xl text-fuchsia-700"><FaVenus /></span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <strong className="text-2xl font-black text-fuchsia-800">{formatMoney(gender.female.amount)}</strong>
            <span className="text-sm font-black text-slate-600">{formatNumber(gender.female.invoice_count)} فاکتور</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="font-black text-slate-900">مجموع مبلغ فروش روزانه بر اساس جنسیت</h2>
          <p className="mt-1 text-xs text-slate-500">مقایسه مبلغ خرید آقایان و بانوان</p>
          <div className="mt-5 h-80" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.daily_trend || []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortPersianDate} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(value) => new Intl.NumberFormat("fa-IR", { notation: "compact" }).format(value)} />
                <Tooltip formatter={(value, name) => [formatMoney(value), name === "male_amount" ? "آقایان" : "بانوان"]} labelFormatter={formatPersianDate} contentStyle={{ borderRadius: 12, direction: "rtl" }} />
                <Legend formatter={(value) => value === "male_amount" ? "آقایان" : "بانوان"} />
                <Bar dataKey="male_amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="female_amount" fill="#c026d3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-black text-slate-900">تعداد فاکتور روزانه بر اساس جنسیت</h2>
          <p className="mt-1 text-xs text-slate-500">مقایسه تعداد خریدهای ثبت‌شده</p>
          <div className="mt-5 h-80" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report?.daily_trend || []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatShortPersianDate} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value, name) => [formatNumber(value), name === "male_invoice_count" ? "آقایان" : "بانوان"]} labelFormatter={formatPersianDate} contentStyle={{ borderRadius: 12, direction: "rtl" }} />
                <Legend formatter={(value) => value === "male_invoice_count" ? "آقایان" : "بانوان"} />
                <Line type="monotone" dataKey="male_invoice_count" stroke="#2563eb" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="female_invoice_count" stroke="#c026d3" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card padding={false}>
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">جزئیات روزانه</h2></div>
          <div className="custom-scrollbar max-h-[520px] overflow-auto">
            <table className="w-full min-w-[980px]">
              <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                <tr><th className="px-4 py-3 text-right">تاریخ</th><th className="px-4 py-3 text-right">کل فاکتور</th><th className="px-4 py-3 text-right">کل فروش</th><th className="px-4 py-3 text-right">فاکتور آقایان</th><th className="px-4 py-3 text-right">فروش آقایان</th><th className="px-4 py-3 text-right">فاکتور بانوان</th><th className="px-4 py-3 text-right">فروش بانوان</th></tr>
              </thead>
              <tbody>
                {(report?.daily_trend || []).map((item) => (
                  <tr key={item.date} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">{formatPersianDate(item.date)}</td><td className="px-4 py-3">{formatNumber(item.invoice_count)}</td><td className="px-4 py-3 font-black text-emerald-700">{formatMoney(item.amount)}</td><td className="px-4 py-3">{formatNumber(item.male_invoice_count)}</td><td className="px-4 py-3">{formatMoney(item.male_amount)}</td><td className="px-4 py-3">{formatNumber(item.female_invoice_count)}</td><td className="px-4 py-3">{formatMoney(item.female_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card padding={false}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">روش‌های پرداخت</h2></div>
            <div className="divide-y divide-slate-100">
              {(report?.payment_breakdown || []).map((item) => (
                <div key={item.payment_method} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <div><p className="font-black text-slate-800">{formatPaymentMethod(item.payment_method)}</p><p className="mt-1 text-xs text-slate-500">{formatNumber(item.invoice_count)} فاکتور</p></div>
                  <strong className="text-emerald-700">{formatMoney(item.amount)}</strong>
                </div>
              ))}
              {!report?.payment_breakdown?.length ? <p className="p-5 text-sm text-slate-500">فروشی ثبت نشده است.</p> : null}
            </div>
          </Card>
          <Card padding={false}>
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">مشتریان برتر بازه</h2></div>
            <div className="divide-y divide-slate-100">
              {(report?.top_customers || []).slice(0, 5).map((item) => (
                <div key={item.customer_id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"><div><p className="font-black text-slate-800">{item.customer_name}</p><p className="mt-1 text-xs text-slate-500">{formatNumber(item.invoice_count)} فاکتور</p></div><strong className="text-blue-700">{formatMoney(item.amount)}</strong></div>
              ))}
              {!report?.top_customers?.length ? <p className="p-5 text-sm text-slate-500">داده‌ای وجود ندارد.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default ReportsPage;
