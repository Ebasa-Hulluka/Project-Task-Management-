require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  override: true,
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const DEFAULT_SUPER_ADMIN = {
  email: "ebasahuluka@gmail.com",
  password: "123456",
  name: "ebasahuluka",
};

const seedEmail = process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN.email;
const seedPassword =
  process.env.SUPER_ADMIN_PASSWORD || DEFAULT_SUPER_ADMIN.password;
const seedName = process.env.SUPER_ADMIN_NAME || DEFAULT_SUPER_ADMIN.name;

const seedSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "superAdmin" });
    const existingEmailUser = await User.findOne({ email: seedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(seedPassword, salt);

    if (existingSuperAdmin) {
      if (
        existingEmailUser &&
        existingEmailUser._id.toString() !== existingSuperAdmin._id.toString()
      ) {
        console.log(
          `Cannot update super admin: email "${seedEmail}" is already used by another account with role "${existingEmailUser.role}".`,
        );
        return false;
      }

      existingSuperAdmin.name = seedName;
      existingSuperAdmin.email = seedEmail;
      existingSuperAdmin.password = hashedPassword;
      existingSuperAdmin.roles = ["superAdmin"];
      existingSuperAdmin.role = "superAdmin";
      existingSuperAdmin.status = "active";
      existingSuperAdmin.isActive = true;

      await existingSuperAdmin.save();
      console.log("Super Admin ready:", existingSuperAdmin.email);
      return true;
    }

    if (existingEmailUser) {
      existingEmailUser.name = seedName;
      existingEmailUser.password = hashedPassword;
      existingEmailUser.roles = ["superAdmin"];
      existingEmailUser.role = "superAdmin";
      existingEmailUser.status = "active";
      existingEmailUser.isActive = true;
      await existingEmailUser.save();
      console.log("Promoted existing account to super admin:", existingEmailUser.email);
      return true;
    }

    const superAdmin = new User({
      name: seedName,
      email: seedEmail,
      password: hashedPassword,
      roles: ["superAdmin"],
      role: "superAdmin",
      status: "active",
      isActive: true,
    });

    await superAdmin.save();
    console.log("Super Admin created successfully:", superAdmin.email);
    return true;
  } catch (error) {
    console.error("Error seeding super admin:", error);
    return false;
  }
};

const runSeedSuperAdmin = async () => {
  await connectDB();
  const success = await seedSuperAdmin();
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(success ? 0 : 1);
};

if (require.main === module) {
  runSeedSuperAdmin();
}

module.exports = { seedSuperAdmin };
