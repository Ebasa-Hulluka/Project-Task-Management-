require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  override: true,
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const existingSuperAdmin = await User.findOne({ role: "superAdmin" });
    if (existingSuperAdmin) {
      console.log("Super Admin already exists:", existingSuperAdmin.email);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    const superAdmin = new User({
      name: "Super Admin",
      email: "ebasahuluka@gmail.com",
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