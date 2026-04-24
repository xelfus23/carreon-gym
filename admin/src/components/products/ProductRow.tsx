import { Calendar } from 'lucide-react'
import type { ProductProps } from '../../types'

export default function ProductRow({ product }: { product: ProductProps }) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-6 py-4 font-medium">{product.id}</td>
      <td className="px-6 py-4 font-medium">
        {product.product_name}
      </td>
      <td className="px-6 py-4 text-text-secondary">
        {product.category}
      </td>
      <td className="px-6 py-4 font-mono">
        ₱{product.price.toLocaleString()}
      </td>
      <td className="px-6 py-4">{product.stocks}</td>
      <td className="px-6 py-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(product.last_restock).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4">
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
    </tr>
  )
}
