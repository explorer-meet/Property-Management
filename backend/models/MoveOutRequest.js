const mongoose = require("mongoose");

const moveOutRequestSchema = new mongoose.Schema(
  {
    lease: { type: mongoose.Schema.Types.ObjectId, ref: "Lease", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestedMoveOutDate: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Acknowledgement Pending", "Completed"],
      default: "Pending",
    },
    ownerNote: { type: String, trim: true },
    approvedLastStayingDate: { type: Date },
    closingFormalities: { type: String, trim: true },
    decidedAt: { type: Date },
    cancelledAt: { type: Date },
    tenantCancelReason: { type: String, trim: true },
    completedAt: { type: Date },
    completionNote: { type: String, trim: true },
    settlement: {
      unpaidRentAmount: { type: Number, default: 0 },
      maintenanceDeduction: { type: Number, default: 0 },
      otherDeduction: { type: Number, default: 0 },
      refundableDeposit: { type: Number, default: 0 },
      finalPayableToTenant: { type: Number, default: 0 },
      note: { type: String, trim: true },
    },
    refund: {
      status: {
        type: String,
        enum: ["NotInitiated", "PendingProcessing", "Paid", "Acknowledged", "Disputed", "Resolved"],
        default: "NotInitiated",
      },
      payoutDate: { type: Date },
      payoutReference: { type: String, trim: true },
      payoutProof: { type: String, trim: true },
      ownerNote: { type: String, trim: true },
      tenantAcknowledgedAt: { type: Date },
      tenantAcknowledgementNote: { type: String, trim: true },
      dispute: {
        status: {
          type: String,
          enum: ["None", "Open", "OwnerResponded", "Resolved"],
          default: "None",
        },
        raisedAt: { type: Date },
        resolvedAt: { type: Date },
        tenantMessage: { type: String, trim: true },
        ownerResolutionNote: { type: String, trim: true },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MoveOutRequest", moveOutRequestSchema);
