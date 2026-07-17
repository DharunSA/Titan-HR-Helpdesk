import Notification from '../models/Notification.js';

/**
 * Create a notification for one or more users.
 * Silently ignores errors so a notification failure never breaks the main action.
 *
 * @param {string|string[]} userIds  - User._id (or array of them)
 * @param {string} message           - Human-readable message
 * @param {string} link              - Frontend route to navigate to on click
 * @param {'leave'|'project'|'general'} type
 */
export const createNotification = async (userIds, message, link = '/', type = 'general') => {
  try {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const docs = ids.map((userId) => ({ userId, message, link, type }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error('[Notification] Failed to create notification:', err.message);
  }
};
