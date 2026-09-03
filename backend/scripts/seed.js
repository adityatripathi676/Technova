require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const User = require('../models/User');
const SocietyClub = require('../models/SocietyClub');

const authorityUsers = [
  { name: 'Amrit Mangla', email: 'amrit.mangla@technova.com', password: process.env.APPROVER_1_PASS, role: 'approver' },
  { name: 'Aditya Tripathi', email: 'aditya.tripathi@technova.com', password: process.env.APPROVER_2_PASS, role: 'approver' },
  { name: 'Pooja Khurana', email: 'pooja.mam@technova.com', password: process.env.APPROVER_3_PASS, role: 'approver' },
  { name: 'Admin', email: 'admin.admin@technova.com', password: process.env.ADMIN_PASS, role: 'admin' },
];

const defaultClubs = [
  {
    societyName: 'Technova',
    clubName: 'Tech Club',
    coordinatorName: 'Default Coordinator',
    coordinatorEmail: 'coordinator@technova.com',
    coordinatorPhone: '9999999999',
  },
];

async function seed() {
  if (!process.env.ADMIN_PASS || !process.env.APPROVER_1_PASS || !process.env.APPROVER_2_PASS || !process.env.APPROVER_3_PASS) {
    console.error('❌ Seed error: Passwords must be provided in the .env file for security to avoid leaking them on GitHub.');
    console.error('   Please define ADMIN_PASS, APPROVER_1_PASS, APPROVER_2_PASS, and APPROVER_3_PASS.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Always wipe existing authority users so hashes are always fresh & correct
    const emails = authorityUsers.map(u => u.email.toLowerCase());
    const deleted = await User.deleteMany({ email: { $in: emails } });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Cleared ${deleted.deletedCount} existing user(s) for re-seed`);
    }

    // Create users — password is passed as plaintext; the User pre-save hook
    // (User.js) will bcrypt-hash it exactly once with cost factor 12.
    for (const u of authorityUsers) {
      await User.create({
        name:         u.name,
        email:        u.email.toLowerCase(),
        passwordHash: u.password, // ← plaintext; pre-save hook hashes it once
        role:         u.role,
      });
      console.log(`✅ Created user: ${u.email}`);
    }

    // Seed default clubs (idempotent)
    for (const c of defaultClubs) {
      const exists = await SocietyClub.findOne({ clubName: c.clubName });
      if (!exists) {
        await SocietyClub.create(c);
        console.log(`✅ Created club: ${c.clubName}`);
      } else {
        console.log(`⏭️  Club already exists: ${c.clubName}`);
      }
    }

    console.log('\n🎉 Seed complete. Login credentials:\n');
    authorityUsers.forEach(u => console.log(`  ${u.role.toUpperCase()}: ${u.email}  /  ${u.password}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
