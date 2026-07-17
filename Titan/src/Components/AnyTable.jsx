// src/Components/AnyTable.jsx
import React from 'react';
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { getAvatarSrc } from '../utils/avatarUtils';

const AnyTable = ({ employees, handleView, handleEdit, handleDelete, statusColor, deptColor, isAdmin }) => {
  return (
    <div className="overflow-x-auto rounded-lg shadow border border-zinc-800 mt-4">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-900 text-gray-400">
          <tr>
            <th className="text-left px-4 py-3">Employee</th>
            <th className="text-left px-4 py-3">ID</th>
            <th className="text-left px-4 py-3">Department</th>
            <th className="text-left px-4 py-3">Position</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Join Date</th>
            {isAdmin && <th className="text-left px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-t border-gray-700 hover:bg-gray-800/60">
              <td className="px-4 py-3 flex items-center gap-3">
                <img src={getAvatarSrc(emp.avatar, emp.name)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                <span>{emp.name}</span>
              </td>
              <td className="px-4 py-3">{emp.id}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${deptColor[emp.department]}`}>
                  {emp.department}
                </span>
              </td>
              <td className="px-4 py-3">{emp.position}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[emp.status]}`}>
                  {emp.status}
                </span>
              </td>
              <td className="px-4 py-3">{emp.date}</td>
              {isAdmin && (
                <td className="px-4 py-3 flex items-center gap-3 text-gray-300">
                  <FiEye className="hover:text-blue-500 cursor-pointer" onClick={() => handleView(emp)} />
                  <FiEdit className="hover:text-yellow-400 cursor-pointer" onClick={() => handleEdit(emp)} />
                  <FiTrash2 className="hover:text-red-500 cursor-pointer" onClick={() => handleDelete(emp._id)} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnyTable;
