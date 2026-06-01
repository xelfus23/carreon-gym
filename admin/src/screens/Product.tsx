import { Package } from "lucide-react";
import { useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import ProductRow from "../components/TableRows/ProductRow";
import CustomTable from "../components/CustomTable";
import type { AddFormField, ProductProps } from "../types";
import ToolBar, { type SelectProps } from "../components/ToolBar";
import CustomHeader from "../components/CustomHeader";
import AddModal from "../components/Modals/AddModal";

type SortKey = keyof ProductProps;
type SortDir = "asc" | "desc";
type FilterStatus = "all" | "available" | "unavailable" | "out_of_stock";

export default function Product() {
  const { products, isLoading, refresh } = useProducts();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const PAGE_SIZE = 50;

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
        { label: "Out of Stock", value: "out_of_stock" }
      ]
    },
  ]

  const onUpdateStocks = (p: ProductProps) => {
    console.log(`UPDATING: `, p.product_name)
  }

  const onDelete = (p: ProductProps) => {
    console.log(`DELETING: `, p.product_name)
  }

  const onUpdateAvailability = (p: ProductProps) => {
    console.log(`UPDATING AVAILABILITY: `, p.product_name)
  }

  const onEdit = (p: ProductProps) => {
    console.log(`EDITING: `, p.product_name)
  }

  const fields: AddFormField[] = [
    {
      name: "product_name",
      label: "Product Name",
      type: "text",
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
    {
      name: "price",
      label: "Price",
      type: "number",
    },
    {
      name: "stocks",
      label: "Stocks",
      type: "number",
    },
    {
      name: "last_restock",
      label: "Last Restock",
      type: "text",
    },
    {
      name: "available",
      label: "Available",
      type: "text",
    },
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
          icon={<Package className='text-primary' />}
          hasAction={true}
        />

        <div className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col">

          <ToolBar placeholder="Search product" filtered={paginatedData} search={search} select={select} handleSearchChange={handleSearchChange} />

          <CustomTable
            renderRow={(m: ProductProps) => (
              <ProductRow
                key={m.id}
                product={m}
                onEdit={(m) => onEdit(m)}
                onDelete={(m) => onDelete(m)}
                onUpdateStocks={(m) => onUpdateStocks(m)}
                onUpdateAvailability={(m) => onUpdateAvailability(m)}
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

      </div >

      {isAddModalOpen && (
        <AddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => console.log("Hello World")}
          title="Add Product"
          subtitle="Add a new product to the inventory"
          fields={fields}
          onSave={(data, imageFile) => {
            console.log(`ADDING: `, data, imageFile)
            return Promise.resolve()
          }}
          submitButtonText="Add Product"
        />
      )
      }
    </>
  );
}
