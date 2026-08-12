const mongoose = require('mongoose');
const { Schema } = mongoose;

const injurySchema = new Schema(
  {
    bodyPart: { type: String, required: true },
    note: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
  },
  { _id: false }
);

const badgeSchema = new Schema(
  {
    badgeId: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // select: false — never returned by default queries; authService pulls it
    // in explicitly via .select('+passwordHash') only when checking a login.
    passwordHash: { type: String, default: null, select: false },
    oauthProviders: [
      {
        provider: { type: String, enum: ['google', 'facebook', 'apple'] },
        providerId: String,
        _id: false,
      },
    ],
    role: {
      type: String,
      enum: ['user', 'trainer', 'gym_owner', 'gym_staff', 'admin'],
      default: 'user',
    },
    // Set at login/gym-switch time for gym_owner/gym_staff/trainer sessions.
    // Copied into the JWT payload; read by resolveTenant middleware.
    activeGymId: { type: Schema.Types.ObjectId, ref: 'Gym', default: null },

    profile: {
      name: { type: String, required: true, trim: true },
      avatarUrl: String,
      dob: Date,
      gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
      heightCm: Number,
      weightKg: Number,
      goals: [
        {
          type: String,
          enum: ['weight_loss', 'muscle_gain', 'general_fitness', 'strength', 'endurance'],
        },
      ],
      injuries: [injurySchema],
      experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
      },
    },

    subscriptionTier: { type: String, enum: ['free', 'premium'], default: 'free' },

    gamification: {
      streakDays: { type: Number, default: 0 },
      lastActivityDate: Date,
      badges: [badgeSchema],
      weeklyGoalTarget: { type: Number, default: 0 },
      weeklyGoalProgress: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Never return passwordHash in API responses by default.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
