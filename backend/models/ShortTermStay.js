const mongoose = require("mongoose");

const shortTermStaySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    platform: { type: String, trim: true, maxlength: 60, default: "Airbnb" },
    guestName: { type: String, required: true, trim: true, maxlength: 120 },
    guestsCount: { type: Number, min: 1, max: 20, default: 1 },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShortTermStay", shortTermStaySchema);
