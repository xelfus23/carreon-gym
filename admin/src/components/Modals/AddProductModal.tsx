import { useState, useRef } from "react";
import { X, Upload, Package, Tag, Hash, Loader2 } from "lucide-react";

interface AddProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddProductModal({
    onClose,
    onSuccess,
}: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "supplements",
        price: "",
        stock: "",
        description: "",
        sku: "",
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            // In a real app, you'd handle the File object for upload here
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API logic for Careon Gym Store
        try {
            console.log("Saving Product:", formData);
            await new Promise((res) => setTimeout(res, 1200));
            onSuccess();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-20 flex justify-center bg-black/60 backdrop-blur-sm p-10">
            <div className="w-full max-w-xl bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">
                            Add New Product
                        </h2>
                        <p className="text-xs text-text-secondary mt-1">
                            List a new item in the gym shop
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-border rounded-full transition-colors text-text-secondary"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="product-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-8"
                >
                    {/* Image Upload Area */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            Product Image
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative aspect-video border-2 border-dashed border-border hover:border-primary cursor-pointer overflow-hidden flex flex-col items-center justify-center bg-background group transition-all"
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center space-y-2">
                                    <div className="p-3 bg-surface rounded-full inline-block mb-2 group-hover:scale-110 transition-transform">
                                        <Upload
                                            className="text-primary"
                                            size={24}
                                        />
                                    </div>
                                    <p className="text-sm font-medium text-text-primary">
                                        Click to upload product image
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        PNG, JPG up to 10MB
                                    </p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </div>
                    </div>

                    {/* Primary Info */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">
                                Product Name
                            </label>
                            <div className="relative">
                                <Package
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                    size={16}
                                />
                                <input
                                    required
                                    placeholder="e.g. Whey Protein Isolate"
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase">
                                    Price (PHP)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-text-secondary">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase">
                                    Initial Stock
                                </label>
                                <div className="relative">
                                    <Hash
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                        size={16}
                                    />
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.stock}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                stock: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase">
                                    Category
                                </label>
                                <div className="relative">
                                    <Tag
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                        size={16}
                                    />
                                    <select
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                category: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="supplements">
                                            Supplements
                                        </option>
                                        <option value="gear">Gym Gear</option>
                                        <option value="equipment">
                                            Equipment
                                        </option>
                                        <option value="apparel">Apparel</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase">
                                    SKU / ID
                                </label>
                                <input
                                    placeholder="WH-001"
                                    className="w-full px-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.sku}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sku: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-secondary uppercase">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Describe the product details, benefits, etc."
                                className="w-full px-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                </form>

                {/* Sticky Footer */}
                <div className="p-6 border-t border-border bg-surface flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 px-4 border border-border font-bold text-text-secondary hover:bg-border transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="product-form"
                        type="submit"
                        disabled={loading}
                        className="flex-2 py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-70 active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Publish Product"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
