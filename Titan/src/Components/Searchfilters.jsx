import React from 'react';

const Searchfilters = ({ searchTerm, setSearchTerm, department, setDepartment, status, setStatus }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-3 text-sm">
      <input
        type="text"
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-zinc-800 text-white px-4 py-2 rounded w-full sm:w-1/3 focus:outline-none"
      />
      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="bg-zinc-800 text-white px-4 py-2 rounded focus:outline-none"
      >
        <option>All Departments</option>
        <option>Engineering</option>
        <option>Marketing</option>
        <option>Human Resources</option>
        <option>Finance</option>
        <option>Sales</option>
        <option>Operations</option>
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="bg-zinc-800 text-white px-4 py-2 rounded focus:outline-none"
      >
        <option>All Status</option>
        <option>Active</option>
        <option>On Leave</option>
        <option>Remote</option>
      </select>
    </div>
  );
};

export default Searchfilters;
