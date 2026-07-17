import express from 'express';
import Settings from '../models/Settings.js';
import authMiddleware from '../controllers/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Always work with a single settings document.
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

// GET public branding (logo + company name only) - no auth, used by the
// login/reset screens which run before a user is signed in.
router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ logo: settings.logo || '', companyName: settings.companyName || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET current settings (creates defaults on first access) - Protected
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update settings (upsert the singleton) (Admin only)
router.put('/', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const existing = await getOrCreateSettings();
    const updated = await Settings.findByIdAndUpdate(existing._id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
