/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import type { UniversalAddModalProps } from "../../types";

export default function AddModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  fields,
  submitButtonText = "Submit",
  onSave,
}: UniversalAddModalProps<T>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize defaults whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const defaults = fields.reduce(
      (acc, field) => {
        if (field.type === "select") {
          acc[field.name] = field.options?.[0]?.value ?? "";
        } else if (field.type !== "image") {
          acc[field.name] = "";
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    setFormData(defaults);
    setImagePreview(null);
    setSelectedFile(null);
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass form payload and raw file up to the parent handler
      await onSave(formData as T, selectedFile);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to add resource:", err);
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
            <h2 className="text-xl font-bold text-text-primary">{title}</h2>
            {subtitle && (
              <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-full transition-colors text-text-secondary"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Form Layout */}
        <form
          id="universal-add-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 content-start"
        >
          {fields.map((field) => {
            const isFullWidth =
              field.gridSpan === "full" ||
              field.type === "textarea" ||
              field.type === "image";
            const IconComponent = field.icon;

            return (
              <div
                key={field.name}
                className={`flex flex-col space-y-1.5 ${isFullWidth ? "col-span-2" : "col-span-1"}`}
              >
                {/* Standard Labels */}
                {field.type !== "image" && (
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {field.label}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}

                {/* Render Logic: Image Dropzone */}
                {field.type === "image" && (
                  <div className="space-y-3 w-full">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div
                      onClick={() => !loading && fileInputRef.current?.click()}
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
                            <Upload className="text-primary" size={24} />
                          </div>
                          <p className="text-sm font-medium text-text-primary">
                            Click to upload image
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
                        required={field.required && !selectedFile}
                      />
                    </div>
                  </div>
                )}

                {/* Render Logic: Textarea */}
                {field.type === "textarea" && (
                  <textarea
                    rows={4}
                    name={field.name}
                    value={formData[field.name] ?? ""}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none text-text-primary"
                  />
                )}

                {/* Render Logic: Select Dropdown */}
                {field.type === "select" && (
                  <div className="relative">
                    {IconComponent && (
                      <IconComponent
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                        size={16}
                      />
                    )}
                    <select
                      name={field.name}
                      value={formData[field.name] ?? ""}
                      onChange={handleInputChange}
                      required={field.required}
                      className={`w-full ${IconComponent ? "pl-10" : "px-4"} pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-text-primary`}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Render Logic: Input Fields (Text/Number) */}
                {(field.type === "text" || field.type === "number") && (
                  <div className="relative">
                    {IconComponent && (
                      <IconComponent
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                        size={16}
                      />
                    )}
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] ?? ""}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className={`w-full ${IconComponent ? "pl-10" : "px-4"} pr-4 py-3 bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-text-primary`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </form>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-border bg-surface flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 px-4 border border-border font-bold text-text-secondary hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            form="universal-add-form"
            type="submit"
            disabled={loading}
            className="flex-2 py-3.5 px-4 bg-primary hover:bg-primary-dark text-background font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
