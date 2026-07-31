import {
  FaMars,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUser,
  FaVenus,
  FaWallet,
} from "react-icons/fa";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { formatMoney } from "../../../utils/formatters.js";

function CustomerSelector({
  selectedCustomer,
  search,
  onSearchChange,
  results,
  searching,
  onSelect,
  onClear,
  onCreate,
  onCharge,
}) {
  if (selectedCustomer) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${selectedCustomer.gender === "female" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-blue-100 text-blue-700"}`}>
            {selectedCustomer.gender === "female" ? <FaVenus /> : <FaMars />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-slate-900">{selectedCustomer.full_name}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                {selectedCustomer.mobile}
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              موجودی کیف پول: {formatMoney(selectedCustomer.wallet_balance)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={FaWallet} onClick={onCharge}>
            شارژ کیف پول
          </Button>
          <Button variant="ghost" size="sm" icon={FaTimes} onClick={onClear}>
            تغییر مشتری
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Input
            icon={FaSearch}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="نام یا شماره تلفن مشتری را جستجو کنید..."
            autoFocus
          />
          <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
            {searching ? (
              <p className="px-3 py-4 text-center text-sm font-bold text-slate-500">در حال جستجو...</p>
            ) : results.length ? (
              results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-blue-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${customer.gender === "female" ? "bg-fuchsia-50 text-fuchsia-600" : "bg-blue-50 text-blue-600"}`}>
                      {customer.gender === "female" ? <FaVenus /> : <FaMars />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-800">{customer.full_name}</span>
                      <span className="ltr-input block text-xs text-slate-500">{customer.mobile}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-emerald-700">
                    {formatMoney(customer.wallet_balance)}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-5 text-center">
                <FaUser className="mx-auto mb-2 text-xl text-slate-300" />
                <p className="text-sm font-bold text-slate-600">مشتری پیدا نشد</p>
                <p className="mt-1 text-xs text-slate-400">از دکمه «مشتری جدید» استفاده کنید.</p>
              </div>
            )}
          </div>
        </div>
        <Button icon={FaPlus} onClick={onCreate} className="shrink-0">
          مشتری جدید
        </Button>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">
        برای ثبت فروش، انتخاب مشتری الزامی است تا سابقه خرید و گزارش جنسیتی دقیق بماند.
      </p>
    </div>
  );
}

export default CustomerSelector;
