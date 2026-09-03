const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorEmail: { type: String, required: true },
  actorRole: { type: String, enum: ['admin', 'approver'], required: true },
  action: {
    type: String,
    enum: [
      'LOGIN', 'LOGOUT',
      'APPROVE_ITEM', 'REJECT_ITEM',
      'ASSIGN_CONTACT', 'OVERALL_FEEDBACK',
      'PASSWORD_RESET', 'ADD_USER', 'REMOVE_USER', 'EDIT_USER',
      'ADD_MEMBER', 'REMOVE_MEMBER',
      'ADD_CLUB', 'REMOVE_CLUB',
      'ADD_FIELD', 'TOGGLE_FIELD',
      'POST_UPDATE',
    ],
    required: true,
  },
  targetEventId: { type: String, default: null },
  details: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
