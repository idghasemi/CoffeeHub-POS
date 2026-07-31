function getErrorMessage(error, fallback = "خطایی رخ داد. دوباره تلاش کنید.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors
      .map((item) => item.message)
      .filter(Boolean)
      .join("، ");
  }

  if (error?.code === "ECONNABORTED") {
    return "پاسخ سرور بیش از حد طول کشید. اتصال شبکه را بررسی کنید.";
  }
  if (!error?.response && error?.message === "Network Error") {
    return "ارتباط با بک‌اند برقرار نشد. مطمئن شوید سرور روی پورت ۸۰۰۰ در حال اجراست.";
  }
  return fallback;
}

export { getErrorMessage };
