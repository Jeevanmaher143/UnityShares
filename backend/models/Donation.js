// models/Donation.js
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  resourceName: { type: String, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  customCategory: { type: String },
  description: { type: String, required: true },
  location: { type: String, required: true },
  image: [{ type: String }], // array of image paths
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  requestedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      requestedAt: { type: Date, default: Date.now },
    },
  ],

  finalStatus: {
    type: String,
    enum: ["available", "in_process", "donated"],
    default: "available",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Donation", donationSchema);
