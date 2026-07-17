import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // The User (_id from Auth model) who should receive this notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    // Frontend route to navigate to when clicked
    link: { type: String, default: '/' },
    // 'leave' | 'project' | 'general'
    type: { type: String, enum: ['leave', 'project', 'general'], default: 'general' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
