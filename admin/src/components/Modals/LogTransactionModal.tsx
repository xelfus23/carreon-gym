import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Package,
  X,
} from "lucide-react";
import type { ProductProps, UserAccountProps } from "../../types";
import { useProducts } from "../../hooks/useProducts";
import type { ManualTransactionPayload } from "../../services/purchase.service";
import SectionLabel from "../SubscriptionModal/SectionLabel";
import ErrorBanner from "../SubscriptionModal/ErrorBanner";
import { formatCurrency } from "../../utils/formatCurrency";
import { PAYMENT_METHODS } from "../../constants";

export interface LogTransactionModalProps {
  members?: UserAccountProps[];
  onClose: () => void;
  onSubmit: (payload: ManualTransactionPayload) => Promise<void> | void;
}

interface CartItem {
  product: ProductProps;
  quantity: number;
}

export default function LogTransactionModal({
  members = [],
  onClose,
  onSubmit,
}: LogTransactionModalProps) {
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();

  // ── Form State ─────────────────────────────────────────────────
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<string>("cash");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close modal on Esc keypress
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // ── Derived Product Categories ──────────────────────────────────
  const categories = useMemo(() => {
    const activeProducts = products.filter((p) => p.status !== "unavailable");
    return [
      "all",
      ...Array.from(
        new Set(activeProducts.map((p) => p.category).filter(Boolean)),
      ),
    ];
  }, [products]);

  // Filter products by active category status
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const isVisible = p.status !== "unavailable";
      return matchesCategory && isVisible;
    });
  }, [products, selectedCategory]);

  // ── Cart Calculations ───────────────────────────────────────────
  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
  }, [cart]);

  // ── Cart Interactions ──────────────────────────────────────────
  const addToCart = (product: ProductProps) => {
    if (product.status === "out_of_stock") return;
    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // ── Submission Handler ─────────────────────────────────────────
  const handleLogTransaction = async () => {
    setError(null);
    if (cart.length === 0) {
      setError("Your cart is empty. Add at least one product.");
      return;
    }

    setLoading(true);
    try {
      // Map frontend item structure to backend data line formats
      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: Number(item.product.price),
      }));

      // Assemble transaction payload structure
      const payload: ManualTransactionPayload = {
        user_id: selectedMemberId || null,
        items: itemsPayload,
        total_amount: totalAmount,
        method,
        reference_no:
          method !== "cash" ? referenceNo.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
      };

      // Call external handler passed via view layout components
      await onSubmit(payload);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to record transaction log.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 sm:p-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] bg-surface border border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Log New Transaction (POS)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-border rounded-full text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Split Layout Body ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Panel: Product Catalogue */}
          <div className="w-full md:w-3/5 border-r border-border flex flex-col p-6 overflow-y-auto space-y-4">
            {/* Optional Member Selection */}
            <div>
              <SectionLabel optional>Assign Gym Member</SectionLabel>
              <div className="relative mt-2">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none transition-all"
                >
                  <option value="">Walk-in / Guest Client (Non-member)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Section Layout */}
            <div className="flex-1 flex flex-col min-h-0 pt-2">
              <SectionLabel>Products Menu</SectionLabel>

              {/* Category Selection Tabs */}
              <div className="flex flex-wrap gap-1 mt-2 mb-3 border-b border-border/60 pb-2 shrink-0">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-1 px-3 text-xs font-semibold rounded-full capitalize transition-all duration-150 ${
                        isSelected
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-background text-text-secondary border border-transparent hover:text-text-primary hover:bg-border/40"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Product Grid */}
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 flex-1">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                  <p className="text-xs text-text-secondary">
                    Loading products catalogue...
                  </p>
                </div>
              ) : productsError ? (
                <ErrorBanner message={productsError} />
              ) : filteredProducts.length === 0 ? (
                <p className="text-xs text-text-secondary italic py-8 text-center flex-1">
                  No inventory matches found for this catalog filter.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {filteredProducts.map((product) => {
                    const isOutOfStock = product.status === "out_of_stock";
                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                        className={`p-3 h-fit rounded-lg text-left border flex gap-3 items-center transition-all duration-150 ${
                          isOutOfStock
                            ? "bg-background/40 border-border opacity-50 cursor-not-allowed"
                            : "bg-background border-border hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
                        }`}
                      >
                        {product.icon_url ? (
                          <img
                            src={product.icon_url}
                            alt={product.product_name}
                            className="w-10 h-10 object-cover rounded bg-surface border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-border/40 flex items-center justify-center text-text-secondary shrink-0">
                            <Package size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-text-primary truncate leading-tight">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {formatCurrency(Number(product.price))}
                          </p>
                        </div>
                        {isOutOfStock && (
                          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">
                            OOS
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Transaction Checkout Cart */}
          <div className="w-full md:w-2/5 bg-background/30 flex flex-col p-6 overflow-y-auto justify-between space-y-4">
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <SectionLabel>Current Orders Summary</SectionLabel>

              {/* Basket list rows */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[30vh] md:max-h-none border border-border/40 p-2 rounded-lg bg-background/50">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-text-secondary py-12">
                    <ShoppingCart size={24} className="opacity-30 mb-2" />
                    <p className="text-xs italic">Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 bg-surface border border-border/80 rounded shadow-sm gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {item.product.product_name}
                        </p>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {formatCurrency(
                            Number(item.product.price) * item.quantity,
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center border border-border bg-background rounded hover:bg-border transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold w-6 text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center border border-border bg-background rounded hover:bg-border transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-5 h-5 flex items-center justify-center text-danger hover:bg-danger/10 rounded transition-colors ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Processing Fields */}
              <div className="space-y-3 shrink-0 pt-2">
                <div>
                  <SectionLabel>Payment Method</SectionLabel>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {PAYMENT_METHODS.map((m) => {
                      const active = method === m.value;
                      return (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => setMethod(m.value)}
                          className={`flex items-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                            active
                              ? "bg-primary border-primary text-background"
                              : "bg-surface border-border text-text-secondary hover:border-primary/40 hover:text-text-primary"
                          }`}
                        >
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {method !== "cash" && (
                  <div>
                    <SectionLabel optional>Reference No.</SectionLabel>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="Reference validation hash key"
                      className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <SectionLabel optional>Notes</SectionLabel>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Staff auditing annotations..."
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-xs bg-surface text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Error messaging state container */}
            {error && <ErrorBanner message={error} />}
          </div>
        </div>

        {/* ── Footer Summary Totals Check ── */}
        <div className="p-6 border-t border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs text-text-secondary font-medium">
              Total Balance Charges
            </p>
            <p className="text-2xl font-black text-primary tracking-tight">
              {formatCurrency(totalAmount)}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-border font-semibold rounded-lg hover:bg-border text-text-primary transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogTransaction}
              disabled={loading || cart.length === 0 || productsLoading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-dark active:scale-[0.99] text-background font-bold rounded-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Processing Order...
                </>
              ) : (
                "Complete Sale & Log"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
