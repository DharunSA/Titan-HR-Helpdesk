import React from 'react';
import { getAvatarSrc } from '../utils/avatarUtils';

const EmployeeViewModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 text-white rounded-lg p-6 w-[95%] max-w-md border border-zinc-700 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4 text-accent-400">Employee Details</h2>

        <div className="flex items-center gap-4 mb-4">
          <img
            src={getAvatarSrc(employee.avatar, employee.name)}
            alt={employee.name}
            className="w-16 h-16 rounded-full border-2 border-accent-500 shadow-md object-cover"
          />
          <div>
            <h3 className="text-xl font-semibold">{employee.name}</h3>
            <p className="text-sm text-gray-400">{employee.position}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><span className="text-gray-400">Employee ID:</span> {employee.id}</p>
          <p><span className="text-gray-400">Department:</span> {employee.department}</p>
          <p><span className="text-gray-400">Status:</span> {employee.status}</p>
          <p><span className="text-gray-400">Join Date:</span> {employee.date}</p>
          {employee.email && (
            <p><span className="text-gray-400">Email:</span> {employee.email}</p>
          )}
          {employee.phone && (
            <p><span className="text-gray-400">Phone:</span> {employee.phone}</p>
          )}
          {employee.address && (
            <p><span className="text-gray-400">Address:</span> {employee.address}</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-1 text-sm bg-zinc-700 hover:bg-zinc-600 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeViewModal;
