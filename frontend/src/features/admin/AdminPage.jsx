import { useCallback, useEffect, useState } from "react";
import {
  FaEdit,
  FaIdBadge,
  FaKey,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUserShield,
  FaUsersCog,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";

import EmptyState from "../../components/feedback/EmptyState.jsx";
import LoadingState from "../../components/feedback/LoadingState.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { changePassword } from "../../services/authService.js";
import {
  deactivateEmployee,
  getEmployees,
} from "../../services/employeeService.js";
import {
  deactivateUser,
  getUsers,
} from "../../services/userService.js";
import {
  formatGender,
  formatMoney,
  formatPersianDate,
  formatPersianDateTime,
} from "../../utils/formatters.js";
import {
  confirmAction,
  notifyError,
  notifySuccess,
} from "../../utils/notifications.js";
import EmployeeModal from "./components/EmployeeModal.jsx";
import ResetPasswordModal from "./components/ResetPasswordModal.jsx";
import UserModal from "./components/UserModal.jsx";

const tabs = [
  { id: "users", label: "کاربران سامانه", icon: FaUserShield },
  { id: "employees", label: "کارمندان", icon: FaIdBadge },
  { id: "password", label: "تغییر رمز مدیر", icon: FaKey },
];

function AdminPage() {
  const location = useLocation();
  const { user: currentUser, updateUser: updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "users");
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [userModal, setUserModal] = useState({ open: false, user: null });
  const [employeeModal, setEmployeeModal] = useState({ open: false, employee: null });
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirmation: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const result = await getUsers({ include_inactive: true });
      setUsers(result.items || []);
    } catch (error) {
      notifyError(error, "دریافت کاربران انجام نشد.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const result = await getEmployees({ include_inactive: true });
      setEmployees(result.items || []);
    } catch (error) {
      notifyError(error, "دریافت کارمندان انجام نشد.");
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadEmployees();
  }, [loadEmployees, loadUsers]);

  async function handleDeactivateUser(account) {
    const confirmed = await confirmAction({
      title: "غیرفعال کردن حساب؟",
      text: `کاربر «${account.full_name}» بلافاصله از سامانه خارج می‌شود و دیگر امکان ورود ندارد.`,
      confirmText: "غیرفعال شود",
    });
    if (!confirmed) {
      return;
    }
    try {
      await deactivateUser(account.id);
      notifySuccess("حساب کاربری غیرفعال شد.");
      await loadUsers();
    } catch (error) {
      notifyError(error, "غیرفعال کردن حساب انجام نشد.");
    }
  }

  async function handleDeactivateEmployee(employee) {
    const confirmed = await confirmAction({
      title: "غیرفعال کردن پرونده کارمند؟",
      text: "اطلاعات کارمند حذف نمی‌شود و فقط پرونده از وضعیت فعال خارج خواهد شد.",
      confirmText: "غیرفعال شود",
    });
    if (!confirmed) {
      return;
    }
    try {
      await deactivateEmployee(employee.id);
      notifySuccess("پرونده کارمند غیرفعال شد.");
      await loadEmployees();
    } catch (error) {
      notifyError(error, "غیرفعال کردن کارمند انجام نشد.");
    }
  }

  async function handleUserSaved(savedUser) {
    await loadUsers();
    if (savedUser?.id === currentUser?.id) {
      updateCurrentUser(savedUser);
    }
  }

  async function handleOwnPasswordChange(event) {
    event.preventDefault();
    if (passwordForm.next.length < 4) {
      notifyError(null, "رمز جدید باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirmation) {
      notifyError(null, "تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      setPasswordForm({ current: "", next: "", confirmation: "" });
      notifySuccess("رمز عبور مدیر با موفقیت تغییر کرد.");
    } catch (error) {
      notifyError(error, "تغییر رمز مدیر انجام نشد.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const search = employeeSearch.trim().toLocaleLowerCase("fa");
    if (!search) {
      return true;
    }
    return [employee.full_name, employee.phone, employee.position, employee.shift]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("fa").includes(search));
  });

  return (
    <>
      <PageHeader
        title="کاربران و کارکنان"
        description="مدیریت حساب‌های ورود، سطح دسترسی و پرونده کارمندان کافی‌شاپ"
      />

      <div className="custom-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {activeTab === "users" ? (
        <>
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-900">حساب‌های ورود به سامانه</h2>
              <p className="mt-1 text-xs leading-6 text-slate-500">نقش هر حساب، منوها و دسترسی‌های قابل استفاده را تعیین می‌کند.</p>
            </div>
            <Button icon={FaPlus} onClick={() => setUserModal({ open: true, user: null })}>کاربر جدید</Button>
          </Card>
          <Card padding={false}>
            {usersLoading ? (
              <LoadingState />
            ) : users.length ? (
              <div className="custom-scrollbar overflow-x-auto">
                <table className="w-full min-w-[960px]">
                  <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-4 text-right">نام کاربر</th><th className="px-5 py-4 text-right">نام کاربری</th><th className="px-5 py-4 text-right">نقش</th><th className="px-5 py-4 text-right">آخرین ورود</th><th className="px-5 py-4 text-right">وضعیت</th><th className="px-5 py-4 text-right">عملیات</th></tr></thead>
                  <tbody>
                    {users.map((account) => (
                      <tr key={account.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                        <td className="px-5 py-4"><p className="font-black text-slate-800">{account.full_name}</p>{account.id === currentUser?.id ? <p className="mt-1 text-xs font-bold text-blue-600">حساب جاری</p> : null}</td>
                        <td className="ltr-input px-5 py-4 font-mono text-slate-600">{account.username}</td>
                        <td className="px-5 py-4"><Badge variant={account.role === "admin" ? "violet" : account.role === "women_shift_supervisor" ? "red" : "blue"}>{account.role_label}</Badge></td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500">{formatPersianDateTime(account.last_login_at)}</td>
                        <td className="px-5 py-4"><Badge variant={account.is_active ? "green" : "slate"}>{account.is_active ? "فعال" : "غیرفعال"}</Badge></td>
                        <td className="px-5 py-4"><div className="flex gap-2"><button type="button" className="action-button" title="ویرایش حساب" onClick={() => setUserModal({ open: true, user: account })}><FaEdit /></button><button type="button" className="action-button" title="تغییر رمز" onClick={() => setPasswordUser(account)}><FaKey /></button>{account.is_active && account.id !== currentUser?.id ? <button type="button" className="action-button danger" title="غیرفعال کردن" onClick={() => handleDeactivateUser(account)}><FaTrash /></button> : null}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="حساب کاربری وجود ندارد" />}
          </Card>
        </>
      ) : null}

      {activeTab === "employees" ? (
        <>
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Input label="جستجوی کارمند" icon={FaSearch} value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="نام، تلفن، سمت یا شیفت..." containerClassName="w-full sm:max-w-md" />
              <Button icon={FaPlus} onClick={() => setEmployeeModal({ open: true, employee: null })}>کارمند جدید</Button>
            </div>
          </Card>
          <Card padding={false}>
            {employeesLoading ? (
              <LoadingState />
            ) : filteredEmployees.length ? (
              <div className="custom-scrollbar overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-4 text-right">کارمند</th><th className="px-5 py-4 text-right">جنسیت</th><th className="px-5 py-4 text-right">شماره تلفن</th><th className="px-5 py-4 text-right">سمت</th><th className="px-5 py-4 text-right">شیفت</th><th className="px-5 py-4 text-right">تاریخ استخدام</th><th className="px-5 py-4 text-right">حقوق</th><th className="px-5 py-4 text-right">وضعیت</th><th className="px-5 py-4 text-right">عملیات</th></tr></thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-t border-slate-100 text-sm hover:bg-slate-50">
                        <td className="px-5 py-4 font-black text-slate-800">{employee.full_name}</td>
                        <td className="px-5 py-4">{formatGender(employee.gender)}</td>
                        <td className="ltr-input px-5 py-4 text-slate-600">{employee.phone || "—"}</td>
                        <td className="px-5 py-4 font-bold">{employee.position}</td>
                        <td className="px-5 py-4 text-slate-600">{employee.shift || "—"}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatPersianDate(employee.hire_date)}</td>
                        <td className="px-5 py-4">{employee.salary == null ? "—" : formatMoney(employee.salary)}</td>
                        <td className="px-5 py-4"><Badge variant={employee.is_active ? "green" : "slate"}>{employee.is_active ? "فعال" : "غیرفعال"}</Badge></td>
                        <td className="px-5 py-4"><div className="flex gap-2"><button type="button" className="action-button" title="ویرایش" onClick={() => setEmployeeModal({ open: true, employee })}><FaEdit /></button>{employee.is_active ? <button type="button" className="action-button danger" title="غیرفعال کردن" onClick={() => handleDeactivateEmployee(employee)}><FaTrash /></button> : null}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="کارمندی مطابق جستجو پیدا نشد" />}
          </Card>
        </>
      ) : null}

      {activeTab === "password" ? (
        <Card className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600"><FaKey /></span><div><h2 className="font-black text-slate-900">تغییر رمز حساب مدیر</h2><p className="mt-1 text-xs leading-6 text-slate-500">برای امنیت، رمز فعلی و رمز جدید را وارد کنید. نشست جاری باز می‌ماند و نشست‌های دیگر بسته می‌شوند.</p></div></div>
          <form onSubmit={handleOwnPasswordChange} className="space-y-4">
            <Input label="رمز عبور فعلی" type="password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} className="ltr-input" autoComplete="current-password" required />
            <Input label="رمز عبور جدید" type="password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} className="ltr-input" minLength={4} autoComplete="new-password" required />
            <Input label="تکرار رمز عبور جدید" type="password" value={passwordForm.confirmation} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmation: event.target.value }))} className="ltr-input" minLength={4} autoComplete="new-password" required />
            <Button type="submit" icon={FaKey} loading={passwordSaving} className="w-full sm:w-auto">ثبت رمز جدید</Button>
          </form>
        </Card>
      ) : null}

      <UserModal open={userModal.open} user={userModal.user} onClose={() => setUserModal({ open: false, user: null })} onSaved={handleUserSaved} />
      <EmployeeModal open={employeeModal.open} employee={employeeModal.employee} onClose={() => setEmployeeModal({ open: false, employee: null })} onSaved={loadEmployees} />
      <ResetPasswordModal open={Boolean(passwordUser)} user={passwordUser} onClose={() => setPasswordUser(null)} />
    </>
  );
}

export default AdminPage;
