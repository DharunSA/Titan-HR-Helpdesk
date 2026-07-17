// models/Settings.js
import mongoose from 'mongoose';

// Singleton document holding organisation-wide settings & preferences.
const settingsSchema = new mongoose.Schema({
  // --- Company / Profile ---
  companyName: { type: String, default: 'Titan Company Limited' },
  companyEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  website: { type: String, default: '' },
  timezone: { type: String, default: 'IST (UTC+05:30)' },
  language: { type: String, default: 'English (US)' },
  logo: { type: String, default: '' }, // data URL or image link

  // --- Notification preferences ---
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    leaveRequests: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false },
  },

  // --- Appearance preferences ---
  appearance: {
    theme: { type: String, enum: ['Dark', 'Light'], default: 'Dark' },
    accentColor: { type: String, default: 'Cyan' },
    compactMode: { type: Boolean, default: false },
    collapsedSidebar: { type: Boolean, default: false },
  },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
