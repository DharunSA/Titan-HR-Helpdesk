import React, { useState, useEffect } from 'react';
import { MdClose, MdCloudUpload } from 'react-icons/md';
import { getAvatarSrc } from '../utils/avatarUtils';
import { uploadToCloudinary, validateImageFile } from '../utils/cloudinaryUtils';
import ImageCropModal from './ImageCropModal';
import { toast } from 'react-toastify';

const EmployeeEditModal = ({ isOpen, onClose, employee, onSave }) => {
  const [formData, setFormData] = useState(employee || {});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [tempImageForCrop, setTempImageForCrop] = useState('');

  useEffect(() => {
    setFormData(employee || {});
    setAvatarFile(null);
    setAvatarPreview(employee?.avatar || '');
    setValidationError('');
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setValidationError('');

    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    // Create preview and open crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImageForCrop(event.target.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob) => {
    setAvatarFile(croppedBlob);
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);
    setValidationError('');
    toast.success('Photo cropped successfully!');
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData((prev) => ({ ...prev, avatar: '' }));
    setValidationError('');
    toast.info('Profile photo removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Send a plain object so axios serializes it as JSON — the backend
      // employee routes parse JSON (express.json), not multipart form data.
      const payload = {};
      ['name', 'position', 'department', 'status', 'date', 'birthDate', 'email', 'phone', 'address'].forEach(
        (key) => {
          payload[key] = formData[key] ?? '';
        }
      );

      // If a new file was selected, upload to Cloudinary and send the URL
      if (avatarFile instanceof Blob) {
        try {
          const cloudinaryUrl = await uploadToCloudinary(avatarFile, 'titan_employees');
          payload.avatar = cloudinaryUrl;
        } catch (error) {
          setValidationError(error.message);
          setIsUploading(false);
          return;
        }
      } else if (avatarFile === null && employee?.avatar && avatarPreview === '') {
        // User removed the photo
        payload.avatar = '';
      }

      await onSave(payload, employee._id);
      setIsUploading(false);
    } catch {
      setValidationError('Error saving employee');
      setIsUploading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-zinc-900 text-white rounded-lg p-5 w-[95%] max-w-xl shadow-lg border border-zinc-700 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-yellow-400">Edit Employee</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <MdClose size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="hidden" name="_id" value={formData._id} />

            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Position</label>
              <input
                name="position"
                value={formData.position || ''}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Department</label>
              <select
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              >
                <option>Engineering</option>
                <option>Marketing</option>
                <option>Human Resources</option>
                <option>Finance</option>
                <option>Sales</option>
                <option>Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              >
                <option>Active</option>
                <option>On Leave</option>
                <option>Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Join Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                required
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate || ''}
                onChange={handleChange}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm mb-1">Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
              />
            </div>

            {/* Profile Photo Section */}
            <div className="col-span-2">
              <label className="block text-sm mb-2 font-medium">Profile Photo</label>

              {/* Error Message */}
              {validationError && (
                <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
                  {validationError}
                </div>
              )}

              {/* Photo Preview */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <img
                    src={getAvatarSrc(avatarPreview, formData.name)}
                    alt={formData.name || 'Employee'}
                    className="h-24 w-24 rounded-full object-cover border-2 border-zinc-600"
                  />
                </div>

                {/* Upload Input */}
                <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-accent-600/50 bg-accent-600/10 hover:bg-accent-600/20 cursor-pointer transition">
                  <MdCloudUpload className="text-accent-600" size={20} />
                  <span className="text-sm text-accent-600 font-medium">Click to change photo</span>
                  <input
                    type="file"
                    name="avatarFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Photo Info and Remove Button */}
                <div className="flex items-center justify-between text-xs text-gray-400 px-2">
                  <span>Max size: 5MB | Formats: JPG, PNG, GIF</span>
                  {(avatarPreview || formData.avatar) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-red-500 hover:text-red-400 transition font-medium"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="col-span-2 flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition text-sm disabled:opacity-50"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 transition text-sm disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={tempImageForCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};

export default EmployeeEditModal;
