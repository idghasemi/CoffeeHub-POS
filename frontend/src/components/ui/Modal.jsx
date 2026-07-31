import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const widthClass = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="presentation"
    >
      <section
        className={`flex max-h-[92vh] w-full ${widthClass} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="action-button shrink-0"
            aria-label="بستن"
          >
            <FaTimes />
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {footer ? (
          <footer className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export default Modal;
