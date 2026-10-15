const mongoose = require('mongoose');

const PRIORITY = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS = ['To Do', 'In Progress', 'In Review', 'Done'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY,
        message: 'Priority must be Low, Medium, High, or Urgent',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: STATUS,
        message: 'Status must be To Do, In Progress, In Review, or Done',
      },
      default: 'To Do',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: is the task overdue?
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'Done') return false;
  return new Date(this.dueDate) < new Date();
});

// Indexes for filtering, sorting, searching
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ title: 'text', description: 'text' }); // full-text search

module.exports = mongoose.model('Task', taskSchema);
