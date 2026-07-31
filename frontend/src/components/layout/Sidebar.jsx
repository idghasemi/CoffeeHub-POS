import {
  FaBoxes,
  FaCashRegister,
  FaChartLine,
  FaDatabase,
  FaFileInvoiceDollar,
  FaHome,
  FaTags,
  FaTimes,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext.jsx";

const commonItems = [
  { to: "/", label: "پیشخوان", icon: FaHome, end: true },
  { to: "/pos", label: "صندوق فروش", icon: FaCashRegister },
  { to: "/customers", label: "مشتریان", icon: FaUsers },
  { to: "/products", label: "محصولات", icon: FaBoxes },
  { to: "/categories", label: "دسته‌بندی‌ها", icon: FaTags },
  { to: "/invoices", label: "فاکتورها", icon: FaFileInvoiceDollar },
  { to: "/reports", label: "گزارش‌ها", icon: FaChartLine },
];

const adminItems = [
  { to: "/admin", label: "کاربران و کارکنان", icon: FaUserShield },
  { to: "/backup", label: "نسخه پشتیبان", icon: FaDatabase },
];

function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = user?.role === "admin" ? [...commonItems, ...adminItems] : commonItems;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-slate-800 bg-slate-950 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black shadow-lg shadow-blue-950/30">
              C
            </span>
            <div>
              <p className="text-lg font-black">CoffeeHub</p>
              <p className="text-xs text-slate-400">کافی‌شاپ باشگاه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="بستن منو"
          >
            <FaTimes />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-xs font-bold text-slate-500">منوی اصلی</p>
          <div className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon className="text-base" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl bg-slate-900 px-4 py-3">
            <p className="truncate text-sm font-bold">{user?.full_name}</p>
            <p className="mt-1 text-xs text-slate-400">{user?.role_label}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
