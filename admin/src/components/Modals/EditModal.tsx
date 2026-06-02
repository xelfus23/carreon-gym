/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Upload } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import type { UniversalEditModalProps } from "../../types";

export default function EditModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  fields,
  initialData,
  onSave,
}: UniversalEditModalProps<T>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return; // Ignore updates if the modal is hidden

    if (initialData) {
      setFormData({ ...initialData });
      if (initialData.image_url || initialData.image) {
        setImagePreview(initialData.image_url || initialData.image);
      } else {
        setImagePreview(null);
      }
    } else {
      const defaults = fields.reduce(
        (acc, field) => {
          if (field.type === "select") {
            acc[field.name] = field.options?.[0]?.value ?? "";
          } else if (field.type === "checkbox") {
            acc[field.name] = false;
          } else if (field.type !== "image") {
            acc[field.name] = "";
          }
          return acc;
        },
        {} as Record<string, any>,
      );
      setFormData(defaults);
      setImagePreview(null);
    }
    setSelectedFile(null);
  }, [isOpen, initialData?.id, fields, initialData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      await onSave(formData as T, selectedFile);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save adjustments:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex justify-center items-center bg-black/60 backdrop-blur-sm p-10">
      <div className="w-full max-w-md bg-surface h-[70%] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
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

        {/* Dynamic Form Content */}
        <form
          id="universal-edit-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start"
        >
          {fields.map((field) => {
            const isFullWidth =
              field.gridSpan === "full" ||
              field.type === "textarea" ||
              field.type === "image";
            const IconComponent = field.icon;
            const currentValue = formData[field.name] ?? "";

            return (
              <div
                key={field.name}
                className={`flex flex-col space-y-4 ${isFullWidth ? "col-span-2" : "col-span-1"}`}
              >
                {field.type !== "checkbox" && field.type !== "image" && (
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {field.label}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}

                {/* Render Logic: Image Field */}
                {field.type === "image" && (
                  <div className="space-y-3 w-full">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      {field.label}
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
                          <div className="p-2 bg-surface rounded-full inline-block mb-2 group-hover:scale-110 transition-transform">
                            <Upload className="text-primary" size={24} />
                          </div>
                          <p className="text-sm font-medium text-text-primary">
                            Click to modify product image
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
                )}

                {/* Render Logic: Textarea Field */}
                {field.type === "textarea" && (
                  <textarea
                    rows={4}
                    name={field.name}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full p-2 text-sm bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none text-text-primary"
                  />
                )}

                {/* Render Logic: Select Dropdown Field */}
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
                      value={currentValue}
                      onChange={handleChange}
                      required={field.required}
                      className={`w-full text-sm ${IconComponent ? "pl-2" : "px-2"} py-2  bg-background border border-border focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-text-primary`}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Render Logic: Checkbox Field */}
                {field.type === "checkbox" && (
                  <label className="flex items-center space-x-3 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={!!currentValue}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      {field.label}
                    </span>
                  </label>
                )}

                {/* Render Logic: Inputs (Text/Number) */}
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
                      value={currentValue}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className={`w-full ${IconComponent ? "pl-10" : "px-2"} pr-2 py-2 bg-background border border-border focus:ring-2 focus:ring-primary text-sm outline-none text-text-primary`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </form>

        {/* Action Footers */}
        <div className="p-4 border-t border-border bg-surface flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 p-2 border border-border font-bold text-text-secondary hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            form="universal-edit-form"
            type="submit"
            disabled={loading}
            className="flex-2 p-2 bg-primary hover:bg-primary-dark text-background font-bold flex items-center justify-center transition-all disabled:opacity-70 text-sm"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
