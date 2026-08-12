const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatConversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['workout', 'diet', 'general'], default: 'general' },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

chatConversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
