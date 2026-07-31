import { useRef, useState } from "react";
import {
  FaCloudDownloadAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaHistory,
  FaUpload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { downloadBackup, restoreBackup } from "../../services/backupService.js";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../utils/notifications.js";

function BackupPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { clearAuth } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleDownload() {
    setDownloading(true);
    try {
      const filename = await downloadBackup();
      notifySuccess(`نسخه پشتیبان «${filename}» ذخیره شد.`);
    } catch (error) {
      notifyError(error, "دریافت نسخه پشتیبان انجام نشد.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestore() {
    if (!selectedFile) {
      notifyError(null, "ابتدا فایل نسخه پشتیبان را انتخاب کنید.");
      return;
    }

    const confirmed = await confirmAction({
      title: "بازگردانی نسخه پشتیبان؟",
      text: "تمام اطلاعات فعلی با محتوای فایل جایگزین می‌شود. سامانه پیش از جایگزینی، یک نسخه اضطراری از وضعیت فعلی می‌سازد.",
      confirmText: "بازگردانی انجام شود",
      icon: "warning",
    });
    if (!confirmed) {
      return;
    }

    setRestoring(true);
    try {
      const result = await restoreBackup(selectedFile);
      notifySuccess(result.message || "نسخه پشتیبان بازگردانی شد.");
      clearAuth();
      navigate("/login", { replace: true, state: { restored: true } });
    } catch (error) {
      notifyError(error, "بازگردانی نسخه پشتیبان انجام نشد.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <PageHeader
        title="نسخه پشتیبان"
        description="دریافت یک کپی کامل از اطلاعات تا این لحظه یا بازگردانی اطلاعات از فایل معتبر"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex flex-col">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600"><FaCloudDownloadAlt /></span>
          <h2 className="mt-5 text-xl font-black text-slate-900">دریافت نسخه پشتیبان تا امروز</h2>
          <p className="mt-3 flex-1 text-sm leading-7 text-slate-500">
            یک فایل SQLite سازگار شامل کاربران، مشتریان، کیف پول‌ها، محصولات، فاکتورها، گزارش‌ها و کارمندان دانلود می‌شود. این عملیات بدون توقف صندوق انجام می‌شود.
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
            پیشنهاد: در پایان هر روز کاری یک نسخه تهیه و روی حافظه‌ای جدا از دستگاه نگهداری کنید.
          </div>
          <Button icon={FaDatabase} size="lg" loading={downloading} onClick={handleDownload} className="mt-5 w-full">
            دانلود نسخه پشتیبان
          </Button>
        </Card>

        <Card className="flex flex-col border-amber-200">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-700"><FaHistory /></span>
          <h2 className="mt-5 text-xl font-black text-slate-900">بازگردانی از فایل</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            فقط فایل‌های پشتیبان ساخته‌شده توسط CoffeeHub پذیرفته می‌شوند. ساختار دیتابیس و سلامت فایل قبل از جایگزینی بررسی خواهد شد.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3"
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 flex min-h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50"
          >
            <FaUpload className="text-2xl text-slate-400" />
            <span className="mt-3 text-sm font-black text-slate-700">
              {selectedFile ? selectedFile.name : "انتخاب فایل نسخه پشتیبان"}
            </span>
            {selectedFile ? (
              <span className="mt-1 text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} مگابایت</span>
            ) : (
              <span className="mt-1 text-xs text-slate-500">پسوند پیشنهادی: .db</span>
            )}
          </button>

          <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
            <FaExclamationTriangle className="mt-1 shrink-0" />
            <span>پس از بازگردانی، از حساب خارج می‌شوید و باید با نام کاربری و رمز موجود در همان نسخه پشتیبان دوباره وارد شوید.</span>
          </div>

          <Button variant="danger" icon={FaUpload} size="lg" loading={restoring} disabled={!selectedFile} onClick={handleRestore} className="mt-5 w-full">
            بازگردانی نسخه پشتیبان
          </Button>
        </Card>
      </div>

      <Card>
        <h2 className="font-black text-slate-900">اطلاعات مهم نگهداری</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["فایل پشتیبان را در فضای امن و ترجیحاً رمزگذاری‌شده نگهداری کنید.", "پس از تغییرات مهم مانند تعریف محصولات یا کاربران، یک نسخه تازه تهیه کنید.", "برای اطمینان، دوره‌ای فایل پشتیبان را روی یک محیط آزمایشی بازگردانی کنید."].map((item, index) => (
            <div key={item} className="rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-600"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">{index + 1}</span>{item}</div>
          ))}
        </div>
      </Card>
    </>
  );
}

export default BackupPage;
