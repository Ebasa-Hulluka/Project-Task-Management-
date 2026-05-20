require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  override: true,
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedEmail = process.env.SUPER_ADMIN_EMAIL || "ebasahuluka@gmail.com";
const seedPassword = process.env.SUPER_ADMIN_PASSWORD || "123456";
const seedName = process.env.SUPER_ADMIN_NAME || "Super Admin";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const existingSuperAdmin = await User.findOne({ role: "superAdmin" });
    const existingEmailUser = await User.findOne({ email: seedEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(seedPassword, salt);

    if (existingSuperAdmin) {
      if (existingSuperAdmin.email === seedEmail) {
        console.log("Super Admin already exists:", existingSuperAdmin.email);
        return;
      }

      if (existingEmailUser && existingEmailUser._id.toString() !== existingSuperAdmin._id.toString()) {
        console.log(
          `Cannot update super admin: email "${seedEmail}" is already used by another account with role "${existingEmailUser.role}".`,
        );
        return;
      }

      existingSuperAdmin.name = seedName;
      existingSuperAdmin.email = seedEmail;
      existingSuperAdmin.password = hashedPassword;
      existingSuperAdmin.status = "active";
      existingSuperAdmin.isActive = true;

      await existingSuperAdmin.save();
      console.log("Updated existing super admin:", existingSuperAdmin.email);
      return;
    }

    if (existingEmailUser) {
      console.log(
        `A user already exists with email "${seedEmail}" and role "${existingEmailUser.role}". Please delete or update that account before seeding a new super admin.`,
      );
      return;
    }

    const superAdmin = new User({
      name: seedName,
      email: seedEmail,
      password: hashedPassword,
      role: "superAdmin",
      status: "active",
      isActive: true,
    });

    await superAdmin.save();
    console.log("Super Admin created successfully:", superAdmin.email);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding super admin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();