const mongoose = require("mongoose");

const propertyInquirySchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inquirer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inquiryType: {
      type: String,
      enum: ["Viewing", "ShortTermRental"],
      default: "Viewing",
    },
    message: { type: String, trim: true, maxlength: 500 },
    shortStayDetails: {
      platform: { type: String, trim: true, maxlength: 60 },
      checkInDate: { type: Date },
      checkOutDate: { type: Date },
      guestsCount: { type: Number, min: 1, max: 20 },
    },
    status: {
      type: String,
      enum: ["New", "In Progress", "Contacted", "Visit Planned", "Visited", "Handled", "Closed"],
      default: "New",
    },
    visitScheduledAt: { type: Date },
    visitNote: { type: String, trim: true, maxlength: 500 },
    visitedAt: { type: Date },
    ownerFollowUpNote: { type: String, trim: true, maxlength: 500 },
    revisitRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

propertyInquirySchema.index({ owner: 1, createdAt: -1 });
propertyInquirySchema.index({ property: 1, inquirer: 1, inquiryType: 1 }, { unique: true });

module.exports = mongoose.model("PropertyInquiry", propertyInquirySchema);
