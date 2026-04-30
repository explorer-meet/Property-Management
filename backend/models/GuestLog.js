const mongoose = require("mongoose");

const guestLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sourceInquiry: { type: mongoose.Schema.Types.ObjectId, ref: "PropertyInquiry", default: null },
    inquiryStatusBeforeVisit: {
      type: String,
      enum: ["New", "In Progress", "Contacted", "Visit Planned", "Visited", "Handled", "Closed"],
      default: "New",
    },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    visitorName: { type: String, required: true, trim: true, maxlength: 100 },
    visitorPhone: { type: String, trim: true, maxlength: 25 },
    purpose: { type: String, trim: true, maxlength: 200 },
    visitDate: { type: Date, required: true },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    vehicleNumber: { type: String, trim: true, maxlength: 30 },
    notes: { type: String, trim: true, maxlength: 400 },
    status: {
      type: String,
      enum: ["Expected", "Checked-In", "Checked-Out", "Cancelled"],
      default: "Expected",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuestLog", guestLogSchema);
