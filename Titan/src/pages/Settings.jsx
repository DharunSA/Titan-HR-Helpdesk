import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Components/Sidebar';
import Topper from '../Components/Topper';
import { FiBell, FiBriefcase, FiLock, FiSave, FiSliders, FiUpload, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCompany } from '../context/CompanyContext';
import { uploadToCloudinary, validateImageFile } from '../utils/cloudinaryUtils';
import { API_BASE_URL } from '../config';

// Tabs marked `everyone` are available to all users; the rest are admin-only.
const TABS = [
  { key: 'account', label: 'Account', icon: <FiUser />, everyone: true },
  { key: 'security', label: 'Security', icon: <FiLock />, everyone: true },
  { key: 'profile', label: 'Company', icon: <FiBriefcase /> },
  { key: 'notifications', label: 'Notifications', icon: <FiBell /> },
  { key: 'appearance', label: 'Appearance', icon: <FiSliders /> },
];

const TIMEZONES = [
  'IST (UTC+05:30)',
  'Pacific Time (US & Canada)',
  'Eastern Time (US & Canada)',
  'GMT (UTC+00:00)',
  'Central European Time (UTC+01:00)',
  'Gulf Standard Time (UTC+04:00)',
  'Japan Standard Time (UTC+09:00)',
];

const LANGUAGES = ['English (US)', 'English (UK)', 'Hindi', 'Tamil', 'French', 'German', 'Spanish'];
const ACCENT_COLORS = ['Cyan', 'Blue', 'Green', 'Purple', 'Amber'];

// Static swatch colours so each option previews its own colour (not the
// currently-applied accent). Kept as literal classes so Tailwind emits them.
const ACCENT_SWATCH = {
  Cyan: 'bg-cyan-500',
  Blue: 'bg-blue-500',
  Green: 'bg-emerald-500',
  Purple: 'bg-purple-500',
  Amber: 'bg-amber-500',
};

// Reusable toggle switch
const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
    <div>
      <p className="text-sm text-gray-200">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-accent-600' : 'bg-zinc-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  </div>
);

const inputClass =
  'w-full bg-zinc-800 text-white px-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-accent-500';
const labelClass = 'block text-sm font-medium text-gray-400 mb-2';

const Settings = () => {
  const { user, isAdmin, updateSession } = useAuth();
  const { setAccentColor, setCompactMode, setSidebarCollapsed, applyAppearance } = useTheme();
  const { refreshCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Personal account (login name + email)
  const [account, setAccount] = useState({ name: '', email: '' });
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/settings`);
      setSettings(res.data);
      // Sync the saved appearance into the live theme.
      applyAppearance(res.data?.appearance);
    } catch (err) {
      console.error('Failed to fetch settings', err);
      toast.error('Unable to load settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Keep non-admins out of admin-only tabs.
  useEffect(() => {
    if (!isAdmin && !['account', 'security'].includes(activeTab)) {
      setActiveTab('account');
    }
  }, [isAdmin, activeTab]);

  // Seed the account form from the logged-in user.
  useEffect(() => {
    if (user) {
      setAccount({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const saveAccount = async (e) => {
    e.preventDefault();
    if (!account.name.trim()) return toast.error('Name is required');
    if (!account.email.trim()) return toast.error('Email is required');

    setSavingAccount(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
        name: account.name.trim(),
        email: account.email.trim(),
      });
      // Apply the fresh token + user so the session reflects the new email.
      updateSession(res.data.token, res.data.user);
      toast.success('Account updated successfully');
    } catch (err) {
      console.error('Failed to update account', err);
      toast.error(err.response?.data?.message || 'Failed to update account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleNested = (section, field, value) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  // Upload the company logo to Cloudinary and store only its URL. (Storing the
  // raw image as a base64 data URL blows past the server's JSON body limit and
  // makes the whole settings save fail.)
  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadToCloudinary(file, 'titan_company');
      handleField('logo', url);
      toast.success('Logo uploaded — click "Save Changes" to apply.');
    } catch (err) {
      console.error('Logo upload failed', err);
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/settings`, settings);
      setSettings(res.data);
      refreshCompany(); // update logo/name shown in the sidebar & auth screens
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwords;
    if (!currentPassword || !newPassword) return toast.error('Please fill all password fields');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');

    const token = localStorage.getItem('token');
    if (!token) return toast.error('You must be logged in to change your password');

    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Failed to change password', err);
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Topper />
        <h1 className="text-3xl font-bold mt-5 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="bg-zinc-900 rounded-lg p-2 mb-6 flex flex-wrap gap-2">
          {TABS.filter(t => isAdmin || t.everyone).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-accent-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {!settings ? (
          <div className="bg-zinc-900 rounded-lg p-6 text-gray-400">Loading settings...</div>
        ) : (
          <div className="bg-zinc-900 rounded-lg p-6 max-w-4xl">
            {/* ACCOUNT (personal login details) */}
            {activeTab === 'account' && (
              <form onSubmit={saveAccount} className="space-y-5 max-w-md">
                <h2 className="text-lg font-semibold text-accent-400">My Account</h2>
                <p className="text-xs text-gray-500 -mt-2">
                  These are your personal sign-in details. Changing your email updates the address you log in with.
                </p>
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    value={account.name}
                    onChange={(e) => setAccount({ ...account, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Login Email</label>
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-400 capitalize">Role: {user?.role || 'employee'}</span>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={savingAccount} className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2 rounded-md text-sm">
                    <FiSave size={14} /> {savingAccount ? 'Saving...' : 'Save Account'}
                  </button>
                </div>
              </form>
            )}

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-accent-400">Company Profile</h2>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <FiUser className="text-gray-500 text-2xl" />
                    )}
                  </div>
                  <div>
                    <label className={`flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm border border-zinc-700 ${uploadingLogo ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
                      {uploadingLogo ? (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-400 border-t-white animate-spin" />
                      ) : (
                        <FiUpload size={14} />
                      )}
                      {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                      <input type="file" accept="image/*" onChange={handleLogo} disabled={uploadingLogo} className="hidden" />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG or WebP up to 5 MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input value={settings.companyName || ''} onChange={(e) => handleField('companyName', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Company Email</label>
                    <input type="email" value={settings.companyEmail || ''} onChange={(e) => handleField('companyEmail', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input value={settings.phone || ''} onChange={(e) => handleField('phone', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input value={settings.website || ''} onChange={(e) => handleField('website', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Timezone</label>
                    <select value={settings.timezone || ''} onChange={(e) => handleField('timezone', e.target.value)} className={inputClass}>
                      {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Language</label>
                    <select value={settings.language || ''} onChange={(e) => handleField('language', e.target.value)} className={inputClass}>
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Address</label>
                  <textarea rows="2" value={settings.address || ''} onChange={(e) => handleField('address', e.target.value)} className={`${inputClass} resize-none`} />
                </div>

                <div className="flex justify-end">
                  <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2 rounded-md text-sm">
                    <FiSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <form onSubmit={changePassword} className="space-y-5 max-w-md">
                <h2 className="text-lg font-semibold text-accent-400">Change Password</h2>
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className={inputClass} />
                </div>
                <p className="text-xs text-gray-500">Password must be at least 6 characters long.</p>
                <div className="flex justify-end">
                  <button type="submit" className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 px-5 py-2 rounded-md text-sm">
                    <FiLock size={14} /> Update Password
                  </button>
                </div>
              </form>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-lg font-semibold text-accent-400 mb-2">Notification Preferences</h2>
                <Toggle label="Email Notifications" description="Receive general updates by email" checked={settings.notifications?.emailNotifications} onChange={(v) => handleNested('notifications', 'emailNotifications', v)} />
                <Toggle label="Leave Request Alerts" description="Get notified when an employee applies for leave" checked={settings.notifications?.leaveRequests} onChange={(v) => handleNested('notifications', 'leaveRequests', v)} />
                <Toggle label="Attendance Alerts" description="Alerts for late check-ins and absences" checked={settings.notifications?.attendanceAlerts} onChange={(v) => handleNested('notifications', 'attendanceAlerts', v)} />
                <Toggle label="Project Updates" description="Notifications on project progress and deadlines" checked={settings.notifications?.projectUpdates} onChange={(v) => handleNested('notifications', 'projectUpdates', v)} />
                <Toggle label="Weekly Reports" description="Receive a weekly summary every Monday" checked={settings.notifications?.weeklyReports} onChange={(v) => handleNested('notifications', 'weeklyReports', v)} />
                <div className="flex justify-end pt-4">
                  <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2 rounded-md text-sm">
                    <FiSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-5 max-w-2xl">
                <h2 className="text-lg font-semibold text-accent-400">Appearance</h2>

                <div>
                  <label className={labelClass}>Accent Color</label>
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map((c) => {
                      const active = (settings.appearance?.accentColor || 'Cyan') === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { handleNested('appearance', 'accentColor', c); setAccentColor(c); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                            active ? 'border-accent-500 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${ACCENT_SWATCH[c]}`} />
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Toggle label="Compact Mode" description="Reduce spacing for a denser layout" checked={settings.appearance?.compactMode} onChange={(v) => { handleNested('appearance', 'compactMode', v); setCompactMode(v); }} />
                <Toggle label="Collapsed Sidebar" description="Keep the sidebar collapsed to icons" checked={settings.appearance?.collapsedSidebar} onChange={(v) => { handleNested('appearance', 'collapsedSidebar', v); setSidebarCollapsed(v); }} />
                <p className="text-xs text-gray-500">Changes apply instantly and are remembered on this device. Click “Save Changes” to store them on your account. (Titan uses a dark theme by design.)</p>
                <div className="flex justify-end">
                  <button onClick={saveSettings} disabled={saving} className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 px-5 py-2 rounded-md text-sm">
                    <FiSave size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
