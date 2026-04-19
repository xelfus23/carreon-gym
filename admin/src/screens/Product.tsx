import { Search, Plus, Package, Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import AddProductModal from "../components/Modals/AddProductModal";
import { useProducts, type ProductProps } from "../hooks/useProducts";

type SortKey = keyof ProductProps;
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "available" | "unavailable" | "out_of_stock";

export default function Product() {
    const { products, isLoading, refreshProducts } = useProducts();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [sortKey, setSortKey] = useState<SortKey>("product_name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const PAGE_SIZE = 50;

    // 1. Filter and Sort logic
    const processedData = useMemo(() => {
        let list = [...(products || [])];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (m) =>
                    m.product_name.toLowerCase().includes(q) ||
                    m.category.toLowerCase().includes(q),
            );
        }

        if (filterStatus !== "all") {
            list = list.filter((m) => m.status === filterStatus);
        }

        list.sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === "number" && typeof bv === "number") {
                return sortDir === "asc" ? av - bv : bv - av;
            }
            const cmp = String(av).localeCompare(String(bv), undefined, {
                numeric: true,
            });
            return sortDir === "asc" ? cmp : -cmp;
        });

        return list;
    }, [search, filterStatus, sortKey, sortDir, products]);

    // 2. Pagination logic
    const totalPages = Math.ceil(processedData.length / PAGE_SIZE);
    const paginatedData = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return processedData.slice(start, start + PAGE_SIZE);
    }, [processedData, page]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    return (
        <>
            <div className="space-y-6 bg-background text-text-primary">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="text-primary" /> Inventory
                        Management
                    </h1>

                    <div className="flex items-center gap-2 ml-auto">
                        {!isLoading && (
                            <button
                                onClick={refreshProducts}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-border
                                           text-text-secondary text-xs font-semibold uppercase tracking-wider
                                           hover:border-primary/40 hover:text-primary transition-all duration-150"
                            >
                                <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="23 4 23 10 17 10" />
                                    <polyline points="1 20 1 14 7 14" />
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                                Refresh
                            </button>
                        )}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-background hover:opacity-90 transition-all text-sm font-medium"
                        >
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-border bg-surface/50 flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                size={16}
                            />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value as FilterStatus);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-background border border-border text-sm outline-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>

                        <span className="text-xs text-text-secondary font-medium ml-auto">
                            {processedData.length} total results
                        </span>
                    </div>

                    {/* Table Area */}
                    <div className="overflow-x-auto overflow-y-auto h-162">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/50 text-text-secondary sticky top-0 z-10 uppercase text-[11px] font-bold tracking-wider">
                                <tr>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-primary"
                                        onClick={() =>
                                            handleSort("product_name")
                                        }
                                    >
                                        Product
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-primary"
                                        onClick={() => handleSort("category")}
                                    >
                                        Category
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-primary"
                                        onClick={() => handleSort("price")}
                                    >
                                        Price
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-primary"
                                        onClick={() => handleSort("stocks")}
                                    >
                                        Stock
                                    </th>
                                    <th
                                        className="px-6 py-4 cursor-pointer hover:text-primary"
                                        onClick={() =>
                                            handleSort("last_restock")
                                        }
                                    >
                                        Last Restock
                                    </th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paginatedData.map((product, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium">
                                            {product.product_name}
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary">
                                            {product.category}
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            ₱{product.price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.stocks}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-text-secondary">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(
                                                    product.last_restock,
                                                ).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    product.status ===
                                                    "available"
                                                        ? "bg-green-100 text-green-700"
                                                        : product.status ===
                                                            "out_of_stock"
                                                          ? "bg-orange-100 text-orange-700"
                                                          : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {product.status.replace(
                                                    "_",
                                                    " ",
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {processedData.length === 0 && (
                            <div className="p-10 text-center text-text-secondary italic">
                                No products found.
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 0 && (
                        <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
                            <span className="text-xs text-text-secondary">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border disabled:opacity-40 transition-colors"
                                >
                                    ← Prev
                                </button>
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${
                                            p === page
                                                ? "bg-primary text-background border-primary"
                                                : "border-border bg-surface hover:bg-border text-text-primary"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border disabled:opacity-40 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isAddModalOpen && (
                <AddProductModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => console.log("Hello Wlrld")}
                />
            )}
        </>
    );
}
