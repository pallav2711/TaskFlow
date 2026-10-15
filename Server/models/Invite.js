const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Invite by email — works even if the user registered after invite was sent
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Resolved once the email matches a registered user
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Keep one invite record per (project + email); the controller reuses it for re-invites.
inviteSchema.index({ project: 1, email: 1 }, { unique: true });
// Fast lookup of all invites for a user's inbox
inviteSchema.index({ invitedUser: 1, status: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
