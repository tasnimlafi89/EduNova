import mongoose from 'mongoose';
import { User } from '../models/User.js';

let isConnected = false;

/**
 * Connect to MongoDB.
 * Uses MONGODB_URI from environment, defaults to local.
 */
export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edunova';

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ MongoDB connected → ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('ℹ  Make sure MongoDB is running or set MONGODB_URI in .env');
    process.exit(1);
  }
}

// ── User CRUD helpers ─────────────────────────────────────────

/**
 * Find or create a user by their Clerk ID.
 * Returns the Mongoose document.
 */
export async function findOrCreateUser(clerkId, { email, name, imageUrl } = {}) {
  let user = await User.findOne({ clerkId });
  if (!user) {
    user = await User.create({
      clerkId,
      email: email || '',
      name: name || 'Navigator',
      imageUrl: imageUrl || '',
      badges: [
        { id: 'first-login', name: 'First Steps', icon: 'rocket_launch', earnedAt: new Date() }
      ]
    });
    console.log(`🆕 Created new user profile for ${clerkId}`);
  }
  return user;
}

/**
 * Get a user's flat profile (the shape the frontend expects).
 */
export async function getProfile(clerkId) {
  const user = await findOrCreateUser(clerkId);
  return user.toProfile();
}

/**
 * Save a mutated profile back to the database.
 * Takes the Mongoose doc + the flat profile that was mutated in-memory.
 */
export async function saveProfile(user, profile) {
  user.syncFromProfile(profile);
  await user.save();
}

export const db = {
  connectDB,
  findOrCreateUser,
  getProfile,
  saveProfile,
  User
};
