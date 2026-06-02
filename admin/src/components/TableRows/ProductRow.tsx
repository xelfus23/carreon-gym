import { Calendar, Edit, Trash } from "lucide-react";
import type { ActionItemProps, ProductProps } from "../../types";
import { useCallback, useRef, useState } from "react";
import { ActionMenu } from "../ActionMenu";

interface ProductRow {
  product: ProductProps;
  onEdit: (p: ProductProps) => void;
  onDelete: (p: ProductProps) => void;
}

export default function ProductRow({ product, onEdit, onDelete }: ProductRow) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMenuOpen(false), []);
  const previewUrl = product.image_urls?.[0] ?? null;

  const actions: ActionItemProps[] = [
    {
      label: "Edit",
      icon: <Edit size={16} />,
      onClick: () => {
        onEdit(product);
        close();
      },
    },
    {
      label: "Delete",
      icon: <Trash size={16} />,
      onClick: () => {
        onDelete(product);
        close();
      },
      variant: "danger",
      dividerBefore: true,
    },
  ];

  return (
    <tr className={`transition-colors group hover:bg-border/40`}>
      <td className="p-4 text-xs text-text-secondary">
        {product.id.toString()}
      </td>
      <td className="p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={product.product_name}
            className="h-10 w-10 rounded-md object-cover border border-border bg-background"
            loading="lazy"
          />
        ) : (
          <div className="h-10 w-10 rounded-md border border-border bg-background" />
        )}
      </td>
      <td className="p-4 font-medium">{product.product_name}</td>
      <td className="p-4 text-text-secondary">{product.category}</td>
      <td className="p-4 font-mono">₱{product.price.toLocaleString()}</td>
      <td className="p-4">{product.stocks}</td>
      <td className="p-4">
        <span
          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${product.status === "available"
              ? "bg-green-100 text-green-700"
              : product.status === "out_of_stock"
                ? "bg-orange-100 text-orange-700"
                : "bg-red-100 text-red-700"
            }`}
        >
          {product.status.replace("_", " ")}
        </span>
      </td>
      <td className="p-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(product.last_restock).toLocaleDateString()}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end">
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Product actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all
                            opacity-0 group-hover:opacity-100 focus:opacity-100
                            ${menuOpen
                ? "opacity-100 bg-border text-text-primary"
                : "text-text-secondary hover:bg-border hover:text-text-primary"
              }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.4" />
              <circle cx="8" cy="8" r="1.4" />
              <circle cx="8" cy="13" r="1.4" />
            </svg>
          </button>

          {menuOpen && (
            <ActionMenu
              items={actions}
              anchorRef={triggerRef}
              onClose={close}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
