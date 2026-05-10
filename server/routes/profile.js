import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ profile: user.profile ?? {}, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const allowed = [
      'name', 'phone', 'dateOfBirth', 'bloodGroup', 'address',
      'preferredLanguage', 'mobilityNeeds', 'usesWheelchair',
      'mobilityLevel', 'walkingLimitMeters', 'allergies',
    ];
    const profileUpdate = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) profileUpdate[`profile.${key}`] = req.body[key];
    }
    if (req.body.insurance) {
      const { provider, plan, memberId } = req.body.insurance;
      if (provider !== undefined) profileUpdate['profile.insurance.provider'] = provider;
      if (plan !== undefined) profileUpdate['profile.insurance.plan'] = plan;
      if (memberId !== undefined) profileUpdate['profile.insurance.memberId'] = memberId;
    }
    if (req.body.emergencyContact) {
      const { name, phone, relationship } = req.body.emergencyContact;
      if (name !== undefined) profileUpdate['profile.emergencyContact.name'] = name;
      if (phone !== undefined) profileUpdate['profile.emergencyContact.phone'] = phone;
      if (relationship !== undefined) profileUpdate['profile.emergencyContact.relationship'] = relationship;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: profileUpdate },
      { new: true, lean: true },
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ profile: user.profile ?? {}, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/email', verifyToken, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) return res.status(400).json({ error: 'newEmail and password required' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Password is incorrect' });

    const normalized = newEmail.toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    user.email = normalized;
    await user.save();
    res.json({ email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
