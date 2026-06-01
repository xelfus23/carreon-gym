import { Package } from "lucide-react";
import { useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductRow from "../components/TableRows/ProductRow";
import CustomTable from "../components/CustomTable";
import type { FormField, ProductProps } from "../types";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import CustomHeader from "../components/CustomHeader";
import AddModal from "../components/Modals/AddModal";
import EditModal from "../components/Modals/EditModal";

type SortKey = keyof ProductProps;
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "available" | "unavailable" | "out_of_stock";

const fields: FormField[] = [
  {
    name: "product_image",
    label: "Product Image",
    type: "image",
    gridSpan: "full",
  },
  {
    name: "product_name",
    label: "Product Name",
    type: "text",
    required: true,
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: [
      { label: "Food", value: "food" },
      { label: "Drink", value: "drink" },
      { label: "Accessory", value: "accessory" },
      { label: "Other", value: "other" },
    ],
  },
  { name: "price", label: "Price", type: "number", required: true },
  { name: "stocks", label: "Stocks", type: "number", required: true },
  { name: "last_restock", label: "Last Restock", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Available", value: "available" },
      { label: "Out of Stock", value: "out_of_stock" },
      { label: "Unavailable", value: "unavailable" },
    ],
  },
];

export default function Products() {
  const { products, isLoading, refresh } = useProducts();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Track selected product object configuration for updates
  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(
    null,
  );

  const PAGE_SIZE = 50;

  // Process and sort arrays unchanged...
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const select: SelectProps[] = [
    {
      value: filterStatus,
      onChange: (e) => {
        setFilterStatus(e.target.value as FilterStatus);
        setPage(1);
      },
      options: [
        { label: "All Status", value: "all" },
        { label: "Available", value: "available" },
        { label: "Unavailable", value: "unavailable" },
        { label: "Out of Stock", value: "out_of_stock" },
      ],
    },
  ];

  const onEdit = (p: ProductProps) => {
    setSelectedProduct(p);
    setIsEditModalOpen(true);
  };

  const onDelete = (p: ProductProps) =>
    console.log(`DELETING: `, p.product_name);

  return (
    <>
      <div className="space-y-4">
        <CustomHeader
          isLoading={isLoading}
          refresh={refresh}
          onClick={() => setIsAddModalOpen(true)}
          buttonLabel="Add Product"
          title="Inventory Management"
          description="Manage carreon gym product inventory"
          icon={<Package className="text-primary" />}
          hasAction={true}
        />

        <div className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col">
          <ToolBar
            placeholder="Search product"
            filtered={paginatedData}
            search={search}
            select={select}
            handleSearchChange={handleSearchChange}
          />

          <CustomTable
            renderRow={(m: ProductProps) => (
              <ProductRow
                key={m.id}
                product={m}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
            data={paginatedData}
            totalItems={totalPages}
            setPage={setPage}
            page={page}
            pageSize={PAGE_SIZE}
            onSort={handleSort}
            columns={[
              { label: "Product ID", key: "id", sortable: true },
              { label: "Product", key: "product_name", sortable: true },
              { label: "Category", key: "category", sortable: true },
              { label: "Price", key: "price", sortable: true },
              { label: "Stocks", key: "stocks", sortable: true },
              { label: "Last Restock", key: "last_restock", sortable: true },
              { label: "", key: null },
            ]}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => refresh()}
          title="Add Product"
          subtitle="Add a new product to the inventory"
          fields={fields}
          onSave={(data, imageFile) => {
            console.log(`ADDING PAYLOAD: `, data, imageFile);
            return Promise.resolve();
          }}
          submitButtonText="Add Product"
        />
      )}

      {isEditModalOpen && (
        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => refresh()}
          title="Edit Product"
          subtitle={`Modifying context details for ${selectedProduct?.product_name || "product"}`}
          fields={fields}
          initialData={selectedProduct}
          onSave={(data, imageFile) => {
            console.log(`UPDATING PAYLOAD: `, data, imageFile);
            return Promise.resolve();
          }}
        />
      )}
    </>
  );
}
