const mongoose = require("mongoose");

const ReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    attachment: {
      type: AttachmentSchema,
      default: null,
    },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deliveredTo: {
      type: [ReceiptSchema],
      default: [],
    },
    seenBy: {
      type: [ReceiptSchema],
      default: [],
    },
  },
  { timestamps: true },
);

MessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
