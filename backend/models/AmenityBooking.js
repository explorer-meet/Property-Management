const mongoose = require("mongoose");

const amenityBookingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    amenityType: {
      type: String,
      enum: ["Clubhouse", "Parking", "Gym", "Pool", "Other"],
      required: true,
    },
    title: { type: String, trim: true, maxlength: 120, default: "" },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, maxlength: 400 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AmenityBooking", amenityBookingSchema);
