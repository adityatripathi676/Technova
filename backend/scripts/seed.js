require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const User = require('../models/User');
const SocietyClub = require('../models/SocietyClub');

/**
 * Seed script — ONLY used to create the first Admin account.
 * After that, all user management is done from the Admin Dashboard UI.
 * 
 * Usage: ADMIN_EMAIL=admin@technova.com ADMIN_PASS=yourpassword node scripts/seed.js
 */
async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin.admin@technova.com';
  const adminPass  = process.env.ADMIN_PASS;

  if (!adminPass) {
    console.error('❌ Error: Please provide ADMIN_PASS as an environment variable.');
    console.error('   Example: ADMIN_PASS=yourpassword node scripts/seed.js');
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  An admin account already exists. Skipping seed.');
      console.log(`   Admin email: ${existingAdmin.email}`);
      process.exit(0);
    }

    await User.create({
      name:         'Admin',
      email:        adminEmail.toLowerCase(),
      passwordHash: adminPass, // pre-save hook hashes it with bcrypt
      role:         'admin',
    });

    console.log(`\n🎉 Admin account created successfully!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`\n   → Log into the Admin Dashboard to create Approver accounts.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
