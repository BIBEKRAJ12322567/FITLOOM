const mongoose = require('mongoose');
const { Schema } = mongoose;
const tenantScopePlugin = require('../plugins/tenantScopePlugin');

const gymTrainerSchema = new Schema(
  {
    trainerId: { type: Schema.Types.ObjectId, ref: 'TrainerProfile', required: true, index: true },
    role: { type: String, enum: ['staff_trainer', 'freelance'], default: 'freelance' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gymTrainerSchema.plugin(tenantScopePlugin);
gymTrainerSchema.index({ gymId: 1, trainerId: 1 }, { unique: true });

module.exports = mongoose.model('GymTrainer', gymTrainerSchema);
