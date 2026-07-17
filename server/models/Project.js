import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['Planning', 'In Progress', 'On Hold', 'Completed'], default: 'Planning' },
  progress: { type: Number, default: 0 },
  projectHead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  description: { type: String }
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
