const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  fieldKey: { type: String, required: true, unique: true, trim: true },
  fieldLabel: { type: String, required: true, trim: true },
  fieldType: {
    type: String,
    enum: ['text', 'textarea', 'checkbox', 'dropdown', 'multiselect', 'number', 'date'],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // for dropdown/multiselect
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('FormField', formFieldSchema);
