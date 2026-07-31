import {
  formatGender,
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDate,
} from "./formatters.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printSalesReport(report) {
  const printWindow = window.open("", "_blank", "width=1100,height=780");
  if (!printWindow) {
    throw new Error("مرورگر پنجره چاپ را مسدود کرده است.");
  }
  printWindow.opener = null;

  const genderRows = (report.gender_breakdown || [])
    .filter((item) => item.gender !== "unknown")
    .map(
      (item) => `<tr><td>${escapeHtml(formatGender(item.gender))}</td><td>${escapeHtml(formatNumber(item.invoice_count))}</td><td>${escapeHtml(formatMoney(item.amount))}</td></tr>`,
    )
    .join("");

  const dailyRows = (report.daily_trend || [])
    .map(
      (item) => `<tr>
        <td>${escapeHtml(formatPersianDate(item.date))}</td>
        <td>${escapeHtml(formatNumber(item.invoice_count))}</td>
        <td>${escapeHtml(formatMoney(item.amount))}</td>
        <td>${escapeHtml(formatNumber(item.male_invoice_count))}</td>
        <td>${escapeHtml(formatMoney(item.male_amount))}</td>
        <td>${escapeHtml(formatNumber(item.female_invoice_count))}</td>
        <td>${escapeHtml(formatMoney(item.female_amount))}</td>
      </tr>`,
    )
    .join("");

  const paymentRows = (report.payment_breakdown || [])
    .map(
      (item) => `<tr><td>${escapeHtml(formatPaymentMethod(item.payment_method))}</td><td>${escapeHtml(formatNumber(item.invoice_count))}</td><td>${escapeHtml(formatMoney(item.amount))}</td></tr>`,
    )
    .join("");

  const summary = report.summary || {};
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>گزارش فروش CoffeeHub</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; color: #0f172a; font-family: Tahoma, Arial, sans-serif; direction: rtl; }
  header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-bottom: 18px; border-bottom: 3px solid #0f172a; }
  h1, h2 { margin: 0; }
  h1 { font-size: 24px; } h2 { margin: 26px 0 12px; font-size: 17px; }
  p { margin: 6px 0 0; color: #64748b; font-size: 12px; }
  .brand { font-size: 22px; font-weight: 900; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .stat { padding: 14px; border: 1px solid #cbd5e1; border-radius: 12px; }
  .stat span { display: block; color: #64748b; font-size: 10px; }
  .stat strong { display: block; margin-top: 8px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 9px 8px; border: 1px solid #e2e8f0; text-align: right; font-size: 10px; }
  th { background: #f1f5f9; color: #475569; }
  footer { margin-top: 26px; padding-top: 14px; border-top: 1px solid #cbd5e1; color: #64748b; text-align: center; font-size: 10px; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<header>
  <div><h1>گزارش فروش کافی‌شاپ باشگاه</h1><p>از ${escapeHtml(formatPersianDate(report.date_from))} تا ${escapeHtml(formatPersianDate(report.date_to))}</p></div>
  <div class="brand">CoffeeHub</div>
</header>
<section class="stats">
  <div class="stat"><span>تعداد فاکتور</span><strong>${escapeHtml(formatNumber(summary.invoice_count))}</strong></div>
  <div class="stat"><span>جمع فروش</span><strong>${escapeHtml(formatMoney(summary.total_amount))}</strong></div>
  <div class="stat"><span>میانگین فاکتور</span><strong>${escapeHtml(formatMoney(summary.average_invoice_amount))}</strong></div>
  <div class="stat"><span>جمع تخفیف</span><strong>${escapeHtml(formatMoney(summary.total_discount))}</strong></div>
</section>
<h2>مقایسه فروش بر اساس جنسیت مشتری</h2>
<table><thead><tr><th>جنسیت</th><th>تعداد فاکتور</th><th>مجموع مبلغ</th></tr></thead><tbody>${genderRows || '<tr><td colspan="3">داده‌ای وجود ندارد.</td></tr>'}</tbody></table>
<h2>روند روزانه</h2>
<table><thead><tr><th>تاریخ</th><th>کل فاکتور</th><th>کل فروش</th><th>فاکتور آقایان</th><th>فروش آقایان</th><th>فاکتور بانوان</th><th>فروش بانوان</th></tr></thead><tbody>${dailyRows || '<tr><td colspan="7">داده‌ای وجود ندارد.</td></tr>'}</tbody></table>
<h2>روش‌های پرداخت</h2>
<table><thead><tr><th>روش پرداخت</th><th>تعداد فاکتور</th><th>مجموع مبلغ</th></tr></thead><tbody>${paymentRows || '<tr><td colspan="3">داده‌ای وجود ندارد.</td></tr>'}</tbody></table>
<footer>گزارش تولیدشده توسط سامانه CoffeeHub — برای ذخیره PDF گزینه Save as PDF را در پنجره چاپ انتخاب کنید.</footer>
<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 150); });<\/script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export { printSalesReport };
