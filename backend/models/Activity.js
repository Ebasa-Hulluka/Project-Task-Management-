const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true },
    details: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Activity", ActivitySchema);
