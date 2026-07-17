import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/Auth.js';
import Employee from '../models/Employee.js';
import { sendEmail, isEmailConfigured } from '../utils/sendEmail.js';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Hash a raw reset token the same way on send and on verify, so the DB never
// holds anything usable if it leaks.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({
      name,
      email: normalizedEmail,
      password,
      role: role || 'employee',
    });

    await newUser.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.findOne({
        email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i'),
      });
    }
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const looksHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    const isMatch = looksHashed ? await bcrypt.compare(password, user.password) : password === user.password;
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!looksHashed) {
      user.password = password;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'employee', name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'employee',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'employee',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Step 1 of reset: user submits their email; we generate a one-time token,
// store its hash, and email them a link. Always responds the same way whether
// or not the email exists, to avoid leaking which accounts are registered.
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const genericResponse = {
      message: 'If an account exists for that email, a password reset link has been sent.',
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a raw token (sent in the link) and store only its hash.
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const text =
      `Hello ${user.name || ''},\n\n` +
      `You requested a password reset for your Titan account.\n\n` +
      `Reset your password using the link below (valid for 1 hour):\n${resetUrl}\n\n` +
      `If you did not request this, you can safely ignore this email.`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#111">
        <h2 style="color:#0891b2">Reset your Titan password</h2>
        <p>Hello ${user.name || ''},</p>
        <p>You requested a password reset for your Titan account.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#0891b2;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:6px;font-weight:bold">
            Reset Password
          </a>
        </p>
        <p style="color:#555;font-size:13px">This link is valid for 1 hour. If you did not request this, you can ignore this email.</p>
        <p style="color:#999;font-size:12px">Or paste this URL into your browser:<br>${resetUrl}</p>
      </div>`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Titan password',
      text,
      html,
    });

    // In dev (no SMTP configured) return the link so the flow is testable.
    if (!isEmailConfigured()) {
      return res.status(200).json({ ...genericResponse, devResetUrl: resetUrl });
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Step 2 of reset: user submits the token (from the link) and a new password.
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    // pre-save hook re-hashes the password; clear the one-time token.
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset. You can now sign in.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update the logged-in user's own account (name + login email). Keeps the
// matching Employee record in sync and re-issues a JWT, since the token embeds
// the email/name and would otherwise go stale after an email change.
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldEmail = user.email;

    if (email !== undefined) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email is required' });
      }
      // Ensure no other account already uses this email.
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ message: 'That email is already in use' });
      }
      user.email = normalizedEmail;
    }

    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }

    await user.save();

    // Keep the employee profile (if any) consistent with the login account.
    await Employee.findOneAndUpdate({ email: oldEmail }, { name: user.name, email: user.email });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'employee', name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Account updated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'employee',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
