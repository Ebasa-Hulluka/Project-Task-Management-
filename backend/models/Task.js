const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const reviewSchema = new mongoose.Schema(
  {
    tester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["passed", "failed"],
      required: true,
    },
    comment: { type: String, default: "" },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "In Review", "Changes Requested", "Completed"],
      default: "Pending",
    },
    dueDate: { type: Date, required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tester: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" }, // NEW: Link to project
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
    reviewHistory: [reviewSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
