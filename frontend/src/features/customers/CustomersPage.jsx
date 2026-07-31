import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCashRegister,
  FaEdit,
  FaFilter,
  FaHistory,
  FaMars,
  FaPlus,
  FaSearch,
  FaTrash,
  FaVenus,
  FaWallet,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Select from "../../components/ui/Select.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  deleteCustomer,
  getCustomers,
} from "../../services/customer/customerService.js";
import {
  formatGender,
  formatMoney,
  formatPersianDate,
} from "../../utils/formatters.js";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../utils/notifications.js";
import CustomerFormModal from "./components/CustomerFormModal.jsx";
import CustomerHistoryModal from "./components/CustomerHistoryModal.jsx";
import WalletChargeModal from "./components/WalletChargeModal.jsx";

function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const defaultGender = user?.default_customer_gender || "";
  const [filters, setFilters] = useState({ search: "", gender: defaultGender });
  const [appliedFilters, setAppliedFilters] = useState({ search: "", gender: defaultGender });
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ open: false, customer: null });
  const [walletCustomer, setWalletCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers({
        search: appliedFilters.search || undefined,
        gender: appliedFilters.gender || undefined,
        page_size: 200,
      });
      setCustomers(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      notifyError(error, "دریافت فهرست مشتریان انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const genderSummary = useMemo(() => {
    return customers.reduce(
      (result, customer) => {
        result[customer.gender] = (result[customer.gender] || 0) + 1;
        return result;
      },
      { male: 0, female: 0 },
    );
  }, [customers]);

  function applyFilters(event) {
    event?.preventDefault();
    setAppliedFilters({ ...filters });
  }

  async function handleDelete(customer) {
    const confirmed = await confirmAction({
      title: "غیرفعال کردن مشتری؟",
      text: "اطلاعات و سوابق خرید حذف نمی‌شوند و فقط مشتری از فهرست فعال خارج می‌شود.",
      confirmText: "غیرفعال شود",
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      notifySuccess("مشتری غیرفعال شد.");
      loadCustomers();
    } catch (error) {
      notifyError(error, "غیرفعال کردن مشتری انجام نشد.");
    }
  }

  return (
    <>
      <PageHeader
        title="مدیریت مشتریان"
        description="ثبت اعضای باشگاه، فیلتر بر اساس جنسیت، کیف پول و مشاهده سوابق خرید"
        actions={
          <Button
            icon={FaPlus}
            onClick={() => setFormState({ open: true, customer: null })}
          >
            مشتری جدید
          </Button>
        }
      />

      {defaultGender ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          بر اساس نقش شما، فیلتر پیش‌فرض روی مشتریان <strong>{formatGender(defaultGender)}</strong> قرار گرفته است؛ از فیلتر جنسیت می‌توانید همه مشتریان یا جنسیت دیگر را نیز ببینید.
        </div>
      ) : null}

      <Card>
        <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <Input
            icon={FaSearch}
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="جستجو با نام، نام خانوادگی یا شماره تلفن..."
          />
          <Select
            value={filters.gender}
            onChange={(event) => setFilters((current) => ({ ...current, gender: event.target.value }))}
          >
            <option value="">همه جنسیت‌ها</option>
            <option value="male">فقط آقایان</option>
            <option value="female">فقط بانوان</option>
          </Select>
          <Button type="submit" icon={FaFilter} variant="secondary">
            اعمال فیلتر
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge variant="slate">نتیجه: {new Intl.NumberFormat("fa-IR").format(total)} مشتری</Badge>
          <Badge variant="blue"><FaMars className="ml-1" /> آقایان: {new Intl.NumberFormat("fa-IR").format(genderSummary.male)}</Badge>
          <Badge variant="violet"><FaVenus className="ml-1" /> بانوان: {new Intl.NumberFormat("fa-IR").format(genderSummary.female)}</Badge>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : customers.length ? (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-500">
                  <th className="px-5 py-4 text-right">مشتری</th>
                  <th className="px-5 py-4 text-right">جنسیت</th>
                  <th className="px-5 py-4 text-right">شماره تلفن</th>
                  <th className="px-5 py-4 text-right">تاریخ عضویت</th>
                  <th className="px-5 py-4 text-right">موجودی کیف پول</th>
                  <th className="px-5 py-4 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${customer.gender === "female" ? "bg-fuchsia-100 text-fuchsia-700" : "bg-blue-100 text-blue-700"}`}>
                          {customer.first_name?.slice(0, 1)}
                        </span>
                        <div>
                          <p className="font-black text-slate-800">{customer.full_name}</p>
                          <p className="mt-1 text-xs text-slate-500">کد مشتری: {customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={customer.gender === "female" ? "violet" : "blue"}>
                        {formatGender(customer.gender)}
                      </Badge>
                    </td>
                    <td className="ltr-input px-5 py-4 font-mono text-slate-700">{customer.mobile}</td>
                    <td className="px-5 py-4 text-slate-600">{formatPersianDate(customer.membership_date || customer.created_at)}</td>
                    <td className="px-5 py-4 font-black text-emerald-700">{formatMoney(customer.wallet_balance)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="action-button"
                          title="ارسال به صندوق"
                          onClick={() => navigate("/pos", { state: { customerId: customer.id } })}
                        >
                          <FaCashRegister />
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          title="شارژ کیف پول"
                          onClick={() => setWalletCustomer(customer)}
                        >
                          <FaWallet />
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          title="سوابق خرید و کیف پول"
                          onClick={() => setHistoryCustomer(customer)}
                        >
                          <FaHistory />
                        </button>
                        <button
                          type="button"
                          className="action-button"
                          title="ویرایش"
                          onClick={() => setFormState({ open: true, customer })}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="action-button danger"
                          title="غیرفعال کردن"
                          onClick={() => handleDelete(customer)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="مشتری مطابق فیلتر پیدا نشد"
            description="فیلترها را تغییر دهید یا یک مشتری جدید ثبت کنید."
            action={
              <Button icon={FaPlus} onClick={() => setFormState({ open: true, customer: null })}>
                ثبت مشتری
              </Button>
            }
          />
        )}
      </Card>

      <CustomerFormModal
        open={formState.open}
        customer={formState.customer}
        defaultGender={defaultGender || "male"}
        onClose={() => setFormState({ open: false, customer: null })}
        onSaved={loadCustomers}
      />
      <WalletChargeModal
        open={Boolean(walletCustomer)}
        customer={walletCustomer}
        onClose={() => setWalletCustomer(null)}
        onCharged={async () => {
          await loadCustomers();
        }}
      />
      <CustomerHistoryModal
        open={Boolean(historyCustomer)}
        customer={historyCustomer}
        onClose={() => setHistoryCustomer(null)}
      />
    </>
  );
}

export default CustomersPage;
