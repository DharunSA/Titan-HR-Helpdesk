import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showErrorToast, showSuccessToast, showInfoToast } from '../utils/toastUtils';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import Searchfilters from '../Components/Searchfilters';
import AnyTable from '../Components/AnyTable';
import AddEmployeeModal from '../Components/AddEmployeeModal';
import EmployeeEditModal from '../Components/EmployeeEditModal';
import EmployeeViewModal from '../Components/EmployeeViewModal';
import { FiDownload } from 'react-icons/fi';
import { exportToCsv } from '../utils/exportCsv';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const statusColor = {
  Active: 'text-green-400 bg-green-900/20',
  'On Leave': 'text-yellow-400 bg-yellow-900/20',
  Remote: 'text-blue-400 bg-blue-900/20',
};

const deptColor = {
  Engineering: 'bg-blue-600/20 text-blue-400',
  Marketing: 'bg-orange-600/20 text-orange-400',
  'Human Resources': 'bg-purple-600/20 text-purple-400',
  Finance: 'bg-green-600/20 text-green-400',
  Sales: 'bg-red-600/20 text-red-400',
  Operations: 'bg-accent-600/20 text-accent-400',
};

const Employees = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [status, setStatus] = useState('All Status');
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch {
      showErrorToast('Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setViewOpen(true);
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setEditOpen(true);
  };

  const handleDelete = async (_id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        console.log('Deleting ID:', _id);  // Debug
        await axios.delete(`${API_BASE_URL}/api/employees/${_id}`);
        showSuccessToast('Employee deleted!');
        fetchEmployees();
      } catch (err) {
        console.error('Delete Error:', err);
        showErrorToast('Error deleting employee');
      }
    }
  };

  const handleAdd = async (data) => {
    try {
      await axios.post(`${API_BASE_URL}/api/employees`, data);
      showSuccessToast('Employee added successfully!');
      fetchEmployees();
      return true;
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to add employee');
      throw err;
    }
  };

  const handleSaveEdit = async (updated, employeeId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/employees/${employeeId}`, updated);
      showInfoToast('Employee updated!');
      fetchEmployees();
      setEditOpen(false);
      return true;
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Update failed!');
      throw err;
    }
  };

  const handleExport = () => {
    const ok = exportToCsv('employees.csv', filteredEmployees, [
      { header: 'Employee ID', accessor: 'id' },
      { header: 'Name', accessor: 'name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Status', accessor: 'status' },
      { header: 'Email', accessor: 'email' },
      { header: 'Phone', accessor: 'phone' },
      { header: 'Join Date', accessor: 'date' },
    ]);
    if (ok) showSuccessToast('Employees exported'); else showErrorToast('Nothing to export');
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchName = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = department === 'All Departments' || emp.department === department;
    const matchStatus = status === 'All Status' || emp.status === status;
    return matchName && matchDept && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Topper />

        <div className="flex justify-between items-center mt-5">
          <h1 className="text-2xl font-bold">Employees</h1>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                className="bg-accent-600 hover:bg-accent-700 text-white px-3 py-2 rounded shadow text-sm"
                onClick={() => setAddOpen(true)}
              >
                + Add Employee
              </button>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded shadow text-sm"
            >
              <FiDownload />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Searchfilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            department={department}
            setDepartment={setDepartment}
            status={status}
            setStatus={setStatus}
          />
        </div>

        <AnyTable
          employees={filteredEmployees}
          handleView={handleView}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          statusColor={statusColor}
          deptColor={deptColor}
          isAdmin={isAdmin}
        />

        {viewOpen && (
          <EmployeeViewModal
            isOpen={viewOpen}
            onClose={() => setViewOpen(false)}
            employee={selectedEmployee}
          />
        )}

        {editOpen && (
          <EmployeeEditModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            employee={selectedEmployee}
            onSave={handleSaveEdit}
          />
        )}

        {addOpen && (
          <AddEmployeeModal
            isOpen={addOpen}
            onClose={() => setAddOpen(false)}
            onAdd={handleAdd}
          />
        )}
      </main>
    </div>
  );
};

export default Employees;
