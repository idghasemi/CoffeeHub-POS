import Swal from "sweetalert2";

import { getErrorMessage } from "./errors.js";

const toast = Swal.mixin({
  toast: true,
  position: "top-start",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

function notifySuccess(message) {
  return toast.fire({ icon: "success", title: message });
}

function notifyError(error, fallback) {
  return toast.fire({
    icon: "error",
    title: getErrorMessage(error, fallback),
  });
}

async function confirmAction({
  title,
  text,
  confirmText = "تأیید",
  cancelText = "انصراف",
  icon = "warning",
}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
  });
  return result.isConfirmed;
}

export { confirmAction, notifyError, notifySuccess };
