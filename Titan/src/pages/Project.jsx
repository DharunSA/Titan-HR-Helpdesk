import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import { FiDownload, FiEdit, FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { MdOutlineManageAccounts } from 'react-icons/md';
import AddProjectModal from '../Components/AddProjectModal';
import ProjectEditModal from '../Components/ProjectEditModal';
import ProjectViewModal from '../Components/ProjectViewModal';
import ProjectProgressModal from '../Components/ProjectProgressModal';
import { showErrorToast, showSuccessToast } from '../utils/toastUtils';
import { exportToCsv } from '../utils/exportCsv';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const TABS = ['All Projects', 'Planning', 'In Progress', 'On Hold', 'Completed'];

const statusStyles = {
  'Planning':    'bg-purple-500/10 text-purple-400',
  'In Progress': 'bg-accent-500/10 text-accent-400',
  'On Hold':     'bg-yellow-500/10 text-yellow-400',
  'Completed':   'bg-green-500/10 text-green-400',
};

const Project = () => {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myEmployeeId, setMyEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Projects');
  const [progressFilter, setProgressFilter] = useState('');

  // Resolve the current employee's ObjectId so we can compare with projectHead
  useEffect(() => {
    if (!isAdmin && user?.email) {
      axios.get(`${API_BASE_URL}/api/employees/me`)
        .then((res) => {
          if (res.data?._id) setMyEmployeeId(res.data._id);
        })
        .catch(() => {});  // silently ignore — head check just won't highlight
    }
  }, [isAdmin, user]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/project`);
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
      showErrorToast('Unable to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/project/${id}`);
      showSuccessToast('Project deleted successfully');
      fetchProjects();
    } catch {
      showErrorToast('Failed to delete project');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setActiveTab('All Projects');
    setProgressFilter('');
  };

  const matchesProgress = (p) => {
    if (!progressFilter) return true;
    const val = p.progress ?? 0;
    if (progressFilter === '0-25')   return val <= 25;
    if (progressFilter === '26-50')  return val > 25 && val <= 50;
    if (progressFilter === '51-75')  return val > 50 && val <= 75;
    if (progressFilter === '76-100') return val > 75;
    return true;
  };

  const handleExport = () => {
    const ok = exportToCsv('projects.csv', filteredProjects, [
      { header: 'Project Name', accessor: 'name' },
      { header: 'Client', accessor: 'client' },
      { header: 'Project Head', accessor: (r) => r.projectHead?.name || '—' },
      { header: 'Start Date', accessor: (r) => (r.startDate ? new Date(r.startDate).toLocaleDateString() : '') },
      { header: 'Deadline', accessor: (r) => (r.deadline ? new Date(r.deadline).toLocaleDateString() : '') },
      { header: 'Team Members', accessor: (r) => (r.teamMembers || []).map((m) => m.name || m).join('; ') },
      { header: 'Progress', accessor: (r) => `${r.progress ?? 0}%` },
      { header: 'Status', accessor: 'status' },
      { header: 'Description', accessor: 'description' },
    ]);
    if (ok) showSuccessToast('Projects exported'); else showErrorToast('Nothing to export');
  };

  const filteredProjects = projects.filter((p) => {
    const term = search.toLowerCase();
    const matchSearch =
      p.name?.toLowerCase().includes(term) || p.status?.toLowerCase().includes(term);
    const matchTab = activeTab === 'All Projects' ? true : p.status === activeTab;
    return matchSearch && matchTab && matchesProgress(p);
  });

  /** True if the currently logged-in employee is the head of this project */
  const isMyProject = (project) =>
    myEmployeeId &&
    project.projectHead &&
    (project.projectHead._id || project.projectHead) === myEmployeeId;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Topper />
        <div className="flex flex-wrap justify-between items-center gap-4 mt-5 mb-6">
          <h1 className="text-3xl font-bold">Project Management</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-gray-200 px-4 py-2 rounded-md shadow text-sm"
            >
              <FiDownload size={14} /> Export
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md shadow text-sm"
              >
                <FiPlus size={16} /> Add Project
              </button>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-zinc-900 rounded-lg p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project name or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-800 text-sm text-white pl-10 pr-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-accent-500"
              />
            </div>
            <div className="flex gap-3 items-center">
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="bg-zinc-800 text-sm text-white px-4 py-2 rounded-md border border-zinc-700"
              >
                <option value="">All Progress</option>
                <option value="0-25">0% - 25%</option>
                <option value="26-50">26% - 50%</option>
                <option value="51-75">51% - 75%</option>
                <option value="76-100">76% - 100%</option>
              </select>
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-white px-4 py-2 rounded-md border border-zinc-700 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-accent-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 p-6 rounded-lg shadow overflow-auto">
          <table className="w-full table-auto text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-300 bg-zinc-800">
                <th className="p-3">Project Name</th>
                <th className="p-3">Client</th>
                <th className="p-3">Project Head</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">Deadline</th>
                <th className="p-3">Team</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const members  = project.teamMembers || [];
                  const progress = project.progress ?? 0;
                  const barColor = project.status === 'Completed' ? 'bg-green-500' : 'bg-accent-500';
                  const imHead   = isMyProject(project);

                  return (
                    <tr
                      key={project._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="p-3 font-medium">{project.name}</td>
                      <td className="p-3 text-gray-300">{project.client}</td>

                      {/* Project Head cell */}
                      <td className="p-3">
                        {project.projectHead ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-bold">
                              {(project.projectHead.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-200">{project.projectHead.name}</span>
                            {imHead && (
                              <span className="text-[10px] bg-accent-600/20 text-accent-400 px-1.5 py-0.5 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">—</span>
                        )}
                      </td>

                      <td className="p-3 text-gray-300">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3 text-gray-300">
                        {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                      </td>

                      {/* Team avatars */}
                      <td className="p-3">
                        <div className="flex items-center">
                          {members.slice(0, 3).map((m, i) => (
                            <div
                              key={m._id || i}
                              title={m.name}
                              className={`w-8 h-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-semibold border-2 border-zinc-900 ${i > 0 ? '-ml-2' : ''}`}
                            >
                              {(m.name || '?').charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {members.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-zinc-700 text-gray-300 flex items-center justify-center text-xs font-semibold border-2 border-zinc-900 -ml-2">
                              +{members.length - 3}
                            </div>
                          )}
                          {members.length === 0 && <span className="text-gray-500 text-xs">—</span>}
                        </div>
                      </td>

                      {/* Progress bar */}
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="flex-1 bg-zinc-700 rounded-full h-2">
                            <div className={`${barColor} h-2 rounded-full`} style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-300 w-9 text-right">{progress}%</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[project.status] || 'bg-zinc-700 text-gray-300'}`}>
                          {project.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex gap-3 items-center">
                          {/* View — everyone */}
                          <button
                            onClick={() => { setSelectedProject(project); setShowViewModal(true); }}
                            className="text-accent-400 hover:text-accent-300"
                            title="View"
                          >
                            <FiEye size={16} />
                          </button>

                          {/* Full edit — admin only */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => { setSelectedProject(project); setShowEditModal(true); }}
                                className="text-yellow-400 hover:text-yellow-300"
                                title="Edit project"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(project._id)}
                                className="text-red-400 hover:text-red-300"
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}

                          {/* Progress update — project head only */}
                          {!isAdmin && imHead && (
                            <button
                              onClick={() => { setSelectedProject(project); setShowProgressModal(true); }}
                              className="text-accent-400 hover:text-accent-300"
                              title="Update progress"
                            >
                              <MdOutlineManageAccounts size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-400">No projects found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        {showAddModal && (
          <AddProjectModal
            onClose={() => setShowAddModal(false)}
            onProjectAdded={fetchProjects}
          />
        )}
        {showEditModal && selectedProject && (
          <ProjectEditModal
            project={selectedProject}
            onClose={() => setShowEditModal(false)}
            onProjectUpdated={fetchProjects}
          />
        )}
        {showViewModal && selectedProject && (
          <ProjectViewModal
            project={selectedProject}
            onClose={() => setShowViewModal(false)}
          />
        )}
        {showProgressModal && selectedProject && (
          <ProjectProgressModal
            project={selectedProject}
            onClose={() => setShowProgressModal(false)}
            onUpdated={fetchProjects}
          />
        )}
      </main>
    </div>
  );
};

export default Project;
