import { useState } from "react";
import { FaBars, FaChevronDown, FaKey, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext.jsx";
import { notifySuccess } from "../../utils/notifications.js";

function Header({ onMenuClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    notifySuccess("از حساب کاربری خارج شدید.");
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="action-button lg:hidden"
          aria-label="باز کردن منو"
        >
          <FaBars />
        </button>
        <div>
          <p className="text-sm font-black text-slate-900">سامانه مدیریت کافی‌شاپ</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            ثبت سریع فروش، مدیریت مشتری و گزارش‌های روزانه
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right transition hover:border-blue-300 hover:bg-blue-50"
        >
          <FaUserCircle className="text-2xl text-blue-600" />
          <span className="hidden sm:block">
            <span className="block max-w-40 truncate text-sm font-black text-slate-800">
              {user?.full_name}
            </span>
            <span className="block text-xs text-slate-500">{user?.role_label}</span>
          </span>
          <FaChevronDown className="text-xs text-slate-400" />
        </button>

        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
              aria-label="بستن منوی کاربر"
            />
            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {user?.role === "admin" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/admin", { state: { tab: "password" } });
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <FaKey />
                  تغییر رمز مدیر
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <FaSignOutAlt />
                خروج از حساب
              </button>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}

export default Header;
