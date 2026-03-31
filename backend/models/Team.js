const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Virtual to get member count
teamSchema.virtual("memberCount").get(function () {
  return this.members?.length || 0;
});

// Ensure virtuals are included in JSON
teamSchema.set("toJSON", { virtuals: true });
teamSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Team", teamSchema);
