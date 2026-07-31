import {
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDateTime,
} from "./formatters.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInvoiceDateTime(invoice) {
  if (invoice?.created_at) {
    return formatPersianDateTime(invoice.created_at);
  }
  if (invoice?.local_date) {
    return `${invoice.local_date} ${invoice.local_time || ""}`.trim();
  }
  return "—";
}

function buildInvoiceHtml(invoice) {
  const items = invoice?.items || [];
  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td>${formatNumber(index + 1)}</td>
          <td>${escapeHtml(item.product_title)}</td>
          <td>${escapeHtml(formatNumber(item.quantity))}</td>
          <td>${escapeHtml(formatMoney(item.unit_price))}</td>
          <td>${escapeHtml(formatMoney(item.total_price))}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>فاکتور ${escapeHtml(invoice?.invoice_number || invoice?.id || "")}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #0f172a; background: #fff; font-family: Tahoma, Arial, sans-serif; direction: rtl; }
    .invoice { width: 100%; max-width: 860px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px; background: #0f172a; color: #fff; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    p { margin: 0; }
    .brand { font-size: 22px; font-weight: 900; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; padding: 22px 24px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .meta strong { display: block; margin-bottom: 5px; color: #64748b; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 13px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 12px; }
    th { background: #f8fafc; color: #475569; }
    .totals { width: min(100%, 420px); margin-right: auto; padding: 20px 24px 24px; }
    .line { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; font-size: 13px; }
    .payable { margin-top: 8px; padding-top: 14px; border-top: 2px solid #0f172a; font-size: 17px; font-weight: 900; }
    footer { padding: 18px 24px; background: #f8fafc; color: #64748b; text-align: center; font-size: 11px; }
    @page { size: A4; margin: 12mm; }
    @media print { body { padding: 0; } .invoice { border: 0; max-width: none; } }
  </style>
</head>
<body>
  <article class="invoice">
    <header>
      <div>
        <h1>فاکتور فروش</h1>
        <p>کافی‌شاپ باشگاه ورزشی</p>
      </div>
      <div class="brand">CoffeeHub</div>
    </header>
    <section class="meta">
      <div><strong>شماره فاکتور</strong>${escapeHtml(invoice?.invoice_number || invoice?.id || "—")}</div>
      <div><strong>تاریخ و ساعت</strong>${escapeHtml(getInvoiceDateTime(invoice))}</div>
      <div><strong>نام مشتری</strong>${escapeHtml(invoice?.customer_name || "—")}</div>
      <div><strong>اپراتور صندوق</strong>${escapeHtml(invoice?.operator_name || "—")}</div>
      <div><strong>روش پرداخت</strong>${escapeHtml(formatPaymentMethod(invoice?.payment_method))}</div>
      <div><strong>وضعیت</strong>${invoice?.status === "completed" ? "تکمیل‌شده" : escapeHtml(invoice?.status || "—")}</div>
    </section>
    <table>
      <thead><tr><th>ردیف</th><th>محصول</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">قلمی ثبت نشده است.</td></tr>'}</tbody>
    </table>
    <section class="totals">
      <div class="line"><span>جمع اقلام</span><strong>${escapeHtml(formatMoney(invoice?.total_amount))}</strong></div>
      <div class="line"><span>تخفیف</span><strong>${escapeHtml(formatMoney(invoice?.discount_amount))}</strong></div>
      <div class="line payable"><span>مبلغ قابل پرداخت</span><strong>${escapeHtml(formatMoney(invoice?.payable_amount))}</strong></div>
    </section>
    <footer>این فاکتور توسط سامانه CoffeeHub ثبت شده است.</footer>
  </article>
  <script>window.addEventListener("load", () => { setTimeout(() => window.print(), 150); });<\/script>
</body>
</html>`;
}

function printInvoice(invoice) {
  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) {
    throw new Error("مرورگر پنجره چاپ را مسدود کرده است.");
  }
  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(buildInvoiceHtml(invoice));
  printWindow.document.close();
}

function drawCanvasText(context, text, x, y, options = {}) {
  const {
    font = "28px Tahoma, Arial, sans-serif",
    align = "right",
    maxWidth,
  } = options;
  context.font = font;
  context.textAlign = align;
  context.direction = "rtl";
  context.fillText(String(text ?? ""), x, y, maxWidth);
}

function downloadInvoiceJpg(invoice) {
  const items = invoice?.items || [];
  const width = 1280;
  const baseHeight = 920;
  const rowHeight = 58;
  const height = Math.max(baseHeight, 650 + items.length * rowHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("ساخت تصویر فاکتور در این مرورگر ممکن نیست.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#0f172a";
  context.fillRect(0, 0, width, 170);
  context.fillStyle = "#ffffff";
  drawCanvasText(context, "CoffeeHub", width - 70, 78, {
    font: "bold 42px Tahoma, Arial, sans-serif",
  });
  drawCanvasText(context, "فاکتور فروش کافی‌شاپ باشگاه", width - 70, 130, {
    font: "28px Tahoma, Arial, sans-serif",
  });

  context.fillStyle = "#0f172a";
  let y = 225;
  const rightX = width - 70;
  const middleX = width / 2 - 20;
  drawCanvasText(context, `شماره فاکتور: ${invoice?.invoice_number || invoice?.id || "—"}`, rightX, y, { font: "bold 25px Tahoma" });
  drawCanvasText(context, `تاریخ: ${getInvoiceDateTime(invoice)}`, middleX, y, { font: "24px Tahoma" });
  y += 54;
  drawCanvasText(context, `مشتری: ${invoice?.customer_name || "—"}`, rightX, y, { font: "24px Tahoma" });
  drawCanvasText(context, `اپراتور: ${invoice?.operator_name || "—"}`, middleX, y, { font: "24px Tahoma" });
  y += 54;
  drawCanvasText(context, `روش پرداخت: ${formatPaymentMethod(invoice?.payment_method)}`, rightX, y, { font: "24px Tahoma" });

  y += 48;
  context.fillStyle = "#f1f5f9";
  context.fillRect(55, y, width - 110, 58);
  context.fillStyle = "#334155";
  drawCanvasText(context, "محصول", width - 90, y + 38, { font: "bold 23px Tahoma" });
  drawCanvasText(context, "تعداد", 720, y + 38, { font: "bold 23px Tahoma" });
  drawCanvasText(context, "قیمت واحد", 490, y + 38, { font: "bold 23px Tahoma" });
  drawCanvasText(context, "جمع", 220, y + 38, { font: "bold 23px Tahoma" });
  y += 58;

  for (const item of items) {
    context.strokeStyle = "#e2e8f0";
    context.beginPath();
    context.moveTo(55, y + rowHeight);
    context.lineTo(width - 55, y + rowHeight);
    context.stroke();
    context.fillStyle = "#0f172a";
    drawCanvasText(context, item.product_title, width - 90, y + 38, { font: "22px Tahoma", maxWidth: 420 });
    drawCanvasText(context, formatNumber(item.quantity), 720, y + 38, { font: "22px Tahoma" });
    drawCanvasText(context, formatMoney(item.unit_price), 490, y + 38, { font: "21px Tahoma" });
    drawCanvasText(context, formatMoney(item.total_price), 220, y + 38, { font: "bold 21px Tahoma" });
    y += rowHeight;
  }

  y += 42;
  context.fillStyle = "#334155";
  drawCanvasText(context, `جمع اقلام: ${formatMoney(invoice?.total_amount)}`, width - 90, y, { font: "24px Tahoma" });
  y += 46;
  drawCanvasText(context, `تخفیف: ${formatMoney(invoice?.discount_amount)}`, width - 90, y, { font: "24px Tahoma" });
  y += 56;
  context.fillStyle = "#0f172a";
  drawCanvasText(context, `مبلغ قابل پرداخت: ${formatMoney(invoice?.payable_amount)}`, width - 90, y, { font: "bold 30px Tahoma" });

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        throw new Error("ساخت فایل JPG انجام نشد.");
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${invoice?.invoice_number || invoice?.id || "coffeehub"}.jpg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    "image/jpeg",
    0.94,
  );
}

export { buildInvoiceHtml, downloadInvoiceJpg, printInvoice };
