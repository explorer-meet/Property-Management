const mongoose = require("mongoose");

const propertyReviewSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Ratings out of 5
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    maintenanceRating: { type: Number, required: true, min: 1, max: 5 },
    locationRating: { type: Number, required: true, min: 1, max: 5 },
    valueRating: { type: Number, required: true, min: 1, max: 5 },
    // Text feedback
    title: { type: String, trim: true, maxlength: 150 },
    comment: { type: String, trim: true, maxlength: 1000 },
    pros: { type: String, trim: true, maxlength: 500 },
    cons: { type: String, trim: true, maxlength: 500 },
    // Visibility
    isPublic: { type: Boolean, default: true },
    // Owner reply
    ownerReply: { type: String, trim: true, maxlength: 600 },
    ownerRepliedAt: { type: Date },
  },
  { timestamps: true }
);

// One review per tenant per property
propertyReviewSchema.index({ property: 1, tenant: 1 }, { unique: true });

module.exports = mongoose.model("PropertyReview", propertyReviewSchema);
