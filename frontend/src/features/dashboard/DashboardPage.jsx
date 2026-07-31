import { useCallback, useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaCashRegister,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaSyncAlt,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import StatCard from "../../components/data/StatCard.jsx";
import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { getDashboardSummary } from "../../services/dashboard/dashboardService.js";
import {
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDateTime,
  formatShortPersianDate,
} from "../../utils/formatters.js";
import { notifyError } from "../../utils/notifications.js";

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getDashboardSummary());
    } catch (error) {
      notifyError(error, "دریافت اطلاعات پیشخوان انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return <LoadingState />;
  }

  const today = data?.today || {};
  const counts = data?.counts || {};
  const genderStats = data?.gender_stats || {};

  return (
    <>
      <PageHeader
        title="پیشخوان"
        description="وضعیت فروش امروز، مشتریان، موجودی و آخرین فعالیت‌های کافی‌شاپ"
        actions={
          <Button
            variant="secondary"
            icon={FaSyncAlt}
            loading={loading}
            onClick={loadDashboard}
          >
            بروزرسانی
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="جمع فروش امروز"
          value={formatMoney(today.total_amount)}
          subtitle={`میانگین هر فاکتور: ${formatMoney(today.average_invoice_amount)}`}
          icon={FaCashRegister}
          tone="green"
        />
        <StatCard
          title="تعداد فاکتور امروز"
          value={formatNumber(today.invoice_count)}
          subtitle="فاکتور تکمیل‌شده"
          icon={FaFileInvoiceDollar}
          tone="blue"
        />
        <StatCard
          title="مشتریان فعال"
          value={formatNumber(counts.active_customers)}
          subtitle={`مجموع کیف پول‌ها: ${formatMoney(data?.wallet_total)}`}
          icon={FaUsers}
          tone="violet"
        />
        <StatCard
          title="هشدار موجودی"
          value={formatNumber(counts.low_stock_products)}
          subtitle={`از ${formatNumber(counts.active_products)} محصول فعال`}
          icon={FaExclamationTriangle}
          tone={counts.low_stock_products ? "red" : "amber"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">روند فروش هفت روز اخیر</h2>
              <p className="mt-1 text-xs text-slate-500">مجموع مبلغ فاکتورهای نهایی‌شده</p>
            </div>
            <FaChartLineIcon />
          </div>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.sales_trend || []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortPersianDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => new Intl.NumberFormat("fa-IR", { notation: "compact" }).format(value)}
                />
                <Tooltip
                  formatter={(value) => [formatMoney(value), "فروش"]}
                  labelFormatter={(label) => formatShortPersianDate(label)}
                  contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", direction: "rtl" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#dashboardSalesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-black text-slate-900">فروش امروز بر اساس جنسیت</h2>
          <p className="mt-1 text-xs text-slate-500">تعداد فاکتور و مجموع مبلغ مشتریان</p>
          <div className="mt-5 space-y-4">
            <GenderSummary
              label="آقایان"
              count={genderStats.male?.invoice_count}
              amount={genderStats.male?.amount}
              className="border-blue-200 bg-blue-50"
            />
            <GenderSummary
              label="بانوان"
              count={genderStats.female?.invoice_count}
              amount={genderStats.female?.amount}
              className="border-fuchsia-200 bg-fuchsia-50"
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric icon={FaBoxOpen} label="محصول فعال" value={counts.active_products} />
            <MiniMetric icon={FaWallet} label="دسته‌بندی فعال" value={counts.active_categories} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card padding={false}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-black text-slate-900">آخرین فاکتورها</h2>
          </div>
          {data?.recent_invoices?.length ? (
            <div className="custom-scrollbar overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-right">شماره</th>
                    <th className="px-5 py-3 text-right">مشتری</th>
                    <th className="px-5 py-3 text-right">مبلغ</th>
                    <th className="px-5 py-3 text-right">پرداخت</th>
                    <th className="px-5 py-3 text-right">زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100 text-sm">
                      <td className="px-5 py-3 font-black text-blue-700">#{invoice.invoice_number}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{invoice.customer_name}</td>
                      <td className="px-5 py-3">{formatMoney(invoice.payable_amount)}</td>
                      <td className="px-5 py-3">{formatPaymentMethod(invoice.payment_method)}</td>
                      <td className="px-5 py-3 text-slate-500">{formatPersianDateTime(invoice.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState compact title="امروز هنوز فروشی ثبت نشده است" />
          )}
        </Card>

        <Card padding={false}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-black text-slate-900">موجودی رو به پایان</h2>
          </div>
          {data?.low_stock_products?.length ? (
            <div className="divide-y divide-slate-100">
              {data.low_stock_products.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{product.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{product.category_title || "بدون دسته"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${product.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {formatNumber(product.stock)} {product.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="موجودی همه محصولات مناسب است" />
          )}
        </Card>
      </div>
    </>
  );
}

function GenderSummary({ label, count, amount, className }) {
  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-black text-slate-800">{label}</span>
        <span className="text-sm font-bold text-slate-600">{formatNumber(count)} فاکتور</span>
      </div>
      <p className="mt-3 text-xl font-black text-slate-900">{formatMoney(amount)}</p>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <Icon className="text-blue-600" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-900">{formatNumber(value)}</p>
    </div>
  );
}

function FaChartLineIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <FaCashRegister />
    </span>
  );
}

export default DashboardPage;
