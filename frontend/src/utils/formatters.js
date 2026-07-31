const moneyFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 2,
});

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tehran",
});

const persianDateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tehran",
});

const paymentMethodLabels = {
  cash: "نقدی",
  card_reader: "کارت‌خوان",
  card_transfer: "کارت‌به‌کارت",
  wallet: "کیف پول",
};

const genderLabels = {
  male: "آقا",
  female: "خانم",
  unknown: "نامشخص",
};

function formatMoney(value) {
  return `${moneyFormatter.format(Number(value || 0))} تومان`;
}

function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00Z`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPersianDate(value) {
  const date = toDate(value);
  return date ? persianDateFormatter.format(date) : "—";
}

function formatPersianDateTime(value) {
  const date = toDate(value);
  return date ? persianDateTimeFormatter.format(date) : "—";
}

function formatShortPersianDate(value) {
  const date = toDate(value);
  if (!date) {
    return "—";
  }
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tehran",
  }).format(date);
}

function formatPaymentMethod(value) {
  return paymentMethodLabels[value] || value || "—";
}

function formatGender(value) {
  return genderLabels[value] || value || "—";
}

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export {
  daysAgoIso,
  formatGender,
  formatMoney,
  formatNumber,
  formatPaymentMethod,
  formatPersianDate,
  formatPersianDateTime,
  formatShortPersianDate,
  genderLabels,
  paymentMethodLabels,
  todayIso,
};
