import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profile: {
      name: String,
      phone: String,
      dateOfBirth: String,
      bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'] },
      insurance: { provider: String, plan: String, memberId: String },
      address: String,
      preferredLanguage: { type: String, default: 'en' },
      mobilityNeeds: String,
      usesWheelchair: Boolean,
      mobilityLevel: { type: String, enum: ['none', 'limited', 'wheelchair'] },
      walkingLimitMeters: Number,
      allergies: String,
      emergencyContact: { name: String, phone: String, relationship: String },
    },
  },
  { timestamps: true },
);

export default mongoose.model('AuthUser', userSchema);
