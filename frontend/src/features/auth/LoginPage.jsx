import { useEffect, useState } from "react";
import { FaCoffee, FaLock, FaSignInAlt, FaUser } from "react-icons/fa";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { getErrorMessage } from "../../utils/errors.js";

const demoAccounts = [
  ["مدیر سامانه", "admin", "1234"],
  ["سرپرست شیفت آقایان", "men", "1234"],
  ["سرپرست شیفت بانوان", "women", "1234"],
];

function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { authenticated, initializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "ورود | CoffeeHub";
  }, []);

  if (!initializing && authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "ورود انجام نشد."));
    } finally {
      setLoading(false);
    }
  }

  function useAccount(username, password) {
    setForm({ username, password });
    setError("");
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto bg-slate-950 p-4 sm:p-8">
      <div className="mx-auto grid min-h-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden px-8 text-white lg:block">
          <span className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-3xl shadow-2xl shadow-blue-900/40">
            <FaCoffee />
          </span>
          <h1 className="max-w-xl text-5xl font-black leading-tight">
            صندوق سریع و دقیق برای کافی‌شاپ باشگاه
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-9 text-slate-300">
            مشتری را انتخاب کنید، کیف پول را شارژ کنید و سفارش را در چند ثانیه
            ثبت کنید؛ تمام فاکتورها و گزارش‌ها به‌صورت یکپارچه ذخیره می‌شوند.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["فروش سریع", "گزارش جنسیتی", "نسخه پشتیبان"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-center text-sm font-bold text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-7 flex items-center gap-4 lg:hidden">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
              <FaCoffee />
            </span>
            <div>
              <p className="text-xl font-black text-slate-900">CoffeeHub</p>
              <p className="text-sm text-slate-500">کافی‌شاپ باشگاه ورزشی</p>
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-900">ورود به سامانه</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            برای مشاهده صندوق و ابزارهای مدیریتی وارد حساب خود شوید.
          </p>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="نام کاربری"
              icon={FaUser}
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              autoComplete="username"
              className="ltr-input"
              required
            />
            <Input
              label="رمز عبور"
              icon={FaLock}
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              autoComplete="current-password"
              className="ltr-input"
              required
            />
            <Button
              type="submit"
              size="lg"
              icon={FaSignInAlt}
              loading={loading}
              className="w-full"
            >
              ورود
            </Button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <p className="mb-3 text-xs font-bold text-slate-500">حساب‌های اولیه</p>
            <div className="space-y-2">
              {demoAccounts.map(([label, username, password]) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => useAccount(username, password)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="font-bold text-slate-700">{label}</span>
                  <span className="ltr-input font-mono text-xs text-slate-500">
                    {username} / {password}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-amber-700">
              پس از اولین ورود، رمزهای پیش‌فرض را از بخش مدیریت کاربران تغییر دهید.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
