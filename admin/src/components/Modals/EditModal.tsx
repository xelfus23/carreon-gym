/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { UniversalEditModalProps } from '../../types'; 

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

  useEffect(() => {
    if (!isOpen) return; // Do nothing if the modal is hidden

    if (initialData) {
      setFormData({ ...initialData }); // Shallow copy to break reference links
    } else {
      const defaults = fields.reduce((acc, field) => {
        acc[field.name] = field.type === 'checkbox' ? false : '';
        return acc;
      }, {} as Record<string, any>);

      setFormData(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // ONLY depend on isOpen. 

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData as T);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save:", err);
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
            {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-full transition-colors text-text-secondary"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Form */}
        <form
          id="universal-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {fields.map((field) => {
            const currentValue = formData[field.name] ?? '';

            return (
              <div key={field.name} className="flex flex-col space-y-1">
                {field.type !== 'checkbox' && (
                  <label className="text-sm font-medium text-text-primary">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                )}

                {/* Textarea Field */}
                {field.type === 'textarea' && (
                  <textarea
                    name={field.name}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full p-2 border border-border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                )}

                {/* Dropdown Select Field */}
                {field.type === 'select' && (
                  <select
                    name={field.name}
                    value={currentValue}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full p-2 border border-border rounded bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Checkbox Field */}
                {field.type === 'checkbox' && (
                  <label className="flex items-center space-x-3 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={!!currentValue}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-text-primary">{field.label}</span>
                  </label>
                )}

                {/* Standard Inputs (text, number) */}
                {(field.type === 'text' || field.type === 'number') && (
                  <input
                    type={field.type}
                    name={field.name}
                    value={currentValue}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full p-2 border border-border rounded bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border rounded text-text-primary hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}