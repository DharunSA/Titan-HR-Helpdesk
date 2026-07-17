import React, { useState } from 'react';
import { getAvatarSrc } from '../utils/avatarUtils';
import { uploadToCloudinary, validateImageFile } from '../utils/cloudinaryUtils';

const AddEmployeeModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: 'Engineering',
    status: 'Active',
    joinDate: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setError('');
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate the photo before doing any work
    if (avatarFile) {
      const validation = validateImageFile(avatarFile);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Build a plain object so axios sends JSON (the backend parses JSON,
      // not multipart form data).
      const payload = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'joinDate') {
          payload.date = value;
        } else {
          payload[key] = value;
        }
      });

      // Upload the photo to Cloudinary and store the returned URL
      if (avatarFile) {
        payload.avatar = await uploadToCloudinary(avatarFile, 'titan_employees');
      }

      await onAdd(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 text-white rounded-lg p-5 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-zinc-700">
        <h2 className="text-lg font-semibold mb-4 text-accent-400">Add Employee</h2>
        {error && (
          <div className="mb-4 rounded border border-red-700 bg-red-900/40 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', name: 'name', placeholder: 'John Doe' },
            { label: 'Position', name: 'position', placeholder: 'Frontend Developer' },
            { label: 'Email', name: 'email', placeholder: 'john@example.com' },
            { label: 'Phone', name: 'phone', placeholder: '+91 xxxxxxxx54' },
            { label: 'Join Date', name: 'joinDate', type: 'date' },
            { label: 'Birth Date', name: 'birthDate', type: 'date' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm mb-1">{field.label}</label>
              <input
                name={field.name}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          ))}

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm mb-2">Profile Photo</label>
            <div className="flex items-center gap-4 rounded border border-dashed border-zinc-700 bg-zinc-800/60 p-3">
              <img
                src={getAvatarSrc(avatarPreview, formData.name)}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover border border-zinc-600"
              />
              <input
                type="file"
                name="avatarFile"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300 file:mr-4 file:rounded file:border-0 file:bg-accent-600 file:px-3 file:py-2 file:text-white hover:file:bg-accent-700"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">Upload a JPG, PNG, or WebP image up to 5 MB.</p>
          </div>

          <div>
            <label className="block text-sm mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            >
              {['Engineering', 'Marketing', 'HR', 'Finance', 'Sales', 'Operations'].map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
            >
              {['Active', 'On Leave', 'Remote'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 resize-none"
              placeholder="123 Main Street, City"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded bg-zinc-700 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 rounded bg-accent-600 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
