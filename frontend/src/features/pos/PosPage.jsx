import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBarcode, FaSearch } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import LoadingState from "../../components/feedback/LoadingState.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import CustomerFormModal from "../customers/components/CustomerFormModal.jsx";
import WalletChargeModal from "../customers/components/WalletChargeModal.jsx";
import InvoiceDetailsModal from "../invoices/components/InvoiceDetailsModal.jsx";
import { getCategories } from "../../services/category/categoryService.js";
import {
  getCustomer,
  getCustomers,
} from "../../services/customer/customerService.js";
import { createInvoice } from "../../services/invoice/invoiceService.js";
import { getProducts } from "../../services/product/productService.js";
import { formatMoney } from "../../utils/formatters.js";
import { notifyError, notifySuccess } from "../../utils/notifications.js";
import CartPanel from "./components/CartPanel.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import CustomerSelector from "./components/CustomerSelector.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import useCart from "./hooks/useCart.js";

function PosPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const barcodeInputRef = useRef(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card_reader");
  const [processing, setProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const cart = useCart();

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [productResult, categoryResult] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(productResult.items || []);
      setCategories(categoryResult.items || []);
    } catch (error) {
      notifyError(error, "دریافت محصولات صندوق انجام نشد.");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const requestedCustomerId = location.state?.customerId;
    if (!requestedCustomerId) {
      return;
    }

    let active = true;
    getCustomer(requestedCustomerId)
      .then((customer) => {
        if (active) {
          setSelectedCustomer(customer);
          setCustomerSearch("");
          navigate("/pos", { replace: true, state: null });
        }
      })
      .catch((error) => notifyError(error, "مشتری انتخاب‌شده دریافت نشد."));
    return () => {
      active = false;
    };
  }, [location.state, navigate]);

  useEffect(() => {
    if (selectedCustomer) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const result = await getCustomers({
          search: customerSearch || undefined,
          gender: customerSearch ? undefined : user?.default_customer_gender || undefined,
          page_size: 30,
        });
        if (active) {
          setCustomerResults(result.items || []);
        }
      } catch (error) {
        if (active) {
          notifyError(error, "جستجوی مشتریان انجام نشد.");
        }
      } finally {
        if (active) {
          setCustomerSearching(false);
        }
      }
    }, customerSearch ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerSearch, selectedCustomer, user?.default_customer_gender]);

  useEffect(() => {
    if (selectedCustomer) {
      barcodeInputRef.current?.focus();
    }
  }, [selectedCustomer]);

  const visibleProducts = useMemo(() => {
    const search = productSearch.trim().toLocaleLowerCase("fa");
    return products.filter((product) => {
      if (categoryId && String(product.category_id) !== String(categoryId)) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        product.title?.toLocaleLowerCase("fa").includes(search) ||
        product.barcode?.toLocaleLowerCase("en").includes(search.toLocaleLowerCase("en"))
      );
    });
  }, [categoryId, productSearch, products]);

  const normalizedDiscount = Math.max(0, Math.min(Number(discount || 0), cart.subtotal));
  const payable = Math.max(0, cart.subtotal - normalizedDiscount);

  function addProduct(product) {
    const result = cart.addProduct(product);
    if (!result.ok) {
      notifyError(
        null,
        result.reason === "stock-limit"
          ? `موجودی «${product.title}» بیشتر از این نیست.`
          : `محصول «${product.title}» موجود نیست.`,
      );
    }
  }

  function handleQuantityChange(productId, value) {
    const result = cart.setQuantity(productId, value);
    if (!result.ok && result.reason === "stock-limit") {
      notifyError(null, "تعداد واردشده بیشتر از موجودی محصول است.");
    }
  }

  function handleIncrement(productId) {
    const result = cart.increment(productId);
    if (!result.ok) {
      notifyError(null, "موجودی محصول بیشتر از این نیست.");
    }
  }

  function handleBarcodeSubmit(event) {
    event.preventDefault();
    const value = barcode.trim();
    if (!value) {
      return;
    }
    const product = products.find(
      (item) => String(item.barcode || "").toLocaleLowerCase("en") === value.toLocaleLowerCase("en"),
    );
    if (!product) {
      notifyError(null, "محصولی با این بارکد پیدا نشد.");
      return;
    }
    addProduct(product);
    setBarcode("");
  }

  function handleDiscountChange(value) {
    if (value === "") {
      setDiscount("");
      return;
    }
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
      return;
    }
    setDiscount(String(Math.max(0, Math.min(amount, cart.subtotal))));
  }

  async function refreshSelectedCustomer(customerId) {
    if (!customerId) {
      return;
    }
    try {
      setSelectedCustomer(await getCustomer(customerId));
    } catch {
      // The invoice has already been recorded; stale wallet display is non-critical.
    }
  }

  async function handleCheckout() {
    if (!selectedCustomer) {
      notifyError(null, "ابتدا مشتری را انتخاب کنید.");
      return;
    }
    if (!cart.items.length) {
      notifyError(null, "سبد سفارش خالی است.");
      return;
    }
    if (paymentMethod === "wallet" && Number(selectedCustomer.wallet_balance) < payable) {
      notifyError(null, "موجودی کیف پول مشتری برای این خرید کافی نیست.");
      return;
    }

    setProcessing(true);
    try {
      const invoice = await createInvoice({
        customer_id: selectedCustomer.id,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          quantity: Number(item.quantity),
        })),
        discount_amount: normalizedDiscount,
        payment_method: paymentMethod,
      });
      setCompletedInvoice(invoice);
      cart.clearCart();
      setDiscount("");
      notifySuccess(
        `فروش با شماره ${invoice.invoice_number} و مبلغ ${formatMoney(invoice.payable_amount)} ثبت شد.`,
      );
      await Promise.all([
        loadCatalog(),
        refreshSelectedCustomer(selectedCustomer.id),
      ]);
    } catch (error) {
      notifyError(error, "ثبت فاکتور انجام نشد؛ موجودی و اطلاعات مشتری را بررسی کنید.");
      await loadCatalog();
    } finally {
      setProcessing(false);
    }
  }

  function handleCustomerCreated(customer) {
    setSelectedCustomer(customer);
    setCustomerResults((current) => [customer, ...current.filter((item) => item.id !== customer.id)]);
    setCustomerSearch("");
  }

  function handleWalletCharged(customer) {
    setSelectedCustomer(customer);
  }

  return (
    <>
      <PageHeader
        title="صندوق فروش"
        description="انتخاب مشتری، اسکن بارکد و ثبت سفارش در سریع‌ترین مسیر ممکن"
      />

      <CustomerSelector
        selectedCustomer={selectedCustomer}
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        results={customerResults}
        searching={customerSearching}
        onSelect={(customer) => {
          setSelectedCustomer(customer);
          setCustomerSearch("");
        }}
        onClear={() => {
          setSelectedCustomer(null);
          setCustomerSearch("");
        }}
        onCreate={() => setCustomerModalOpen(true)}
        onCharge={() => setWalletModalOpen(true)}
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 space-y-4">
          <Card>
            <div className="grid gap-3 lg:grid-cols-2">
              <form onSubmit={handleBarcodeSubmit}>
                <Input
                  label="اسکن یا ورود بارکد"
                  icon={FaBarcode}
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  className="ltr-input"
                  placeholder="بارکد را اسکن کنید و Enter بزنید"
                  disabled={!selectedCustomer}
                  inputRef={barcodeInputRef}
                />
              </form>
              <Input
                label="جستجوی محصول"
                icon={FaSearch}
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="نام محصول یا بارکد..."
              />
            </div>
          </Card>

          <CategoryFilter
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />

          {catalogLoading ? (
            <Card><LoadingState /></Card>
          ) : (
            <ProductGrid products={visibleProducts} onAdd={addProduct} />
          )}
        </section>

        <CartPanel
          items={cart.items}
          subtotal={cart.subtotal}
          discount={discount}
          onDiscountChange={handleDiscountChange}
          payable={payable}
          selectedCustomer={selectedCustomer}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onIncrement={handleIncrement}
          onDecrement={cart.decrement}
          onQuantityChange={handleQuantityChange}
          onRemove={cart.removeProduct}
          onClear={cart.clearCart}
          onCheckout={handleCheckout}
          processing={processing}
        />
      </div>

      <CustomerFormModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        customer={null}
        defaultGender={user?.default_customer_gender || "male"}
        onSaved={handleCustomerCreated}
      />

      <WalletChargeModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        customer={selectedCustomer}
        onCharged={handleWalletCharged}
      />

      <InvoiceDetailsModal
        open={Boolean(completedInvoice)}
        invoice={completedInvoice}
        onClose={() => setCompletedInvoice(null)}
      />
    </>
  );
}

export default PosPage;
