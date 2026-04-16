const mongoose = require("mongoose");

const propertyInquirySchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    inquirer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["New", "In Progress", "Contacted", "Closed"],
      default: "New",
    },
  },
  { timestamps: true }
);

propertyInquirySchema.index({ owner: 1, createdAt: -1 });
propertyInquirySchema.index({ property: 1, inquirer: 1 }, { unique: true });

module.exports = mongoose.model("PropertyInquiry", propertyInquirySchema);
