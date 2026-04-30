/**
 * schedulerService.js
 * Cron-based automation for:
 *   - Rent due reminders (3 days and 1 day before due)
 *   - Lease expiry alerts (30 days and 7 days before end)
 *   - Auto mark-overdue rent records past grace period
 */

const cron = require("node-cron");
const mongoose = require("mongoose");
const Lease = require("../models/Lease");
const RentPayment = require("../models/RentPayment");
const Notification = require("../models/Notification");
const { sendEventEmail } = require("./emailService");

// ─── helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (v) =>
  `INR ${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d, n) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
};

const normalizeGraceDays = (val) => {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

const createNotification = async (payload) => {
  try {
    await Notification.create(payload);
  } catch (_) {
    // non-blocking
  }
};

const sendMailEvent = async (payload) => {
  try {
    await sendEventEmail(payload);
  } catch (_) {
    // non-blocking
  }
};

// ─── job 1: rent due reminders ───────────────────────────────────────────────
// Runs every day at 08:00. Checks Pending rent records due in exactly 3 days
// or exactly 1 day and sends a reminder if one hasn't been sent yet.

const runRentDueReminders = async () => {
  try {
    const today = startOfDay(new Date());
    const in3 = startOfDay(addDays(today, 3));
    const in1 = startOfDay(addDays(today, 1));

    const records = await RentPayment.find({
      status: "Pending",
      dueDate: { $in: [in3, in1] },
    })
      .populate("tenant", "name email")
      .populate("property", "propertyType address")
      .populate("lease", "graceDays");

    for (const record of records) {
      const dueDays = Math.round((startOfDay(record.dueDate) - today) / 86400000);
      const label = dueDays === 1 ? "tomorrow" : "in 3 days";

      const alreadySent = await Notification.findOne({
        recipient: record.tenant?._id,
        type: "rent",
        "metadata.rentId": record._id,
        "metadata.reminderDays": dueDays,
      });
      if (alreadySent) continue;

      await createNotification({
        recipient: record.tenant?._id,
        role: "tenant",
        title: "Rent due reminder",
        message: `Your ${record.month} ${record.year} rent of ${formatCurrency(record.amount)} is due ${label} (${new Date(record.dueDate).toLocaleDateString()}).`,
        type: "rent",
        actionPath: "/tenant/rent",
        metadata: { rentId: record._id, reminderDays: dueDays },
      });

      await sendMailEvent({
        to: record.tenant?.email,
        subject: `Rent due ${label}: ${record.month} ${record.year}`,
        recipientName: record.tenant?.name,
        heading: `Rent is due ${label}`,
        lead: `This is a reminder that your rent payment is due ${label}.`,
        highlights: [
          `Month: ${record.month} ${record.year}`,
          `Amount: ${formatCurrency(record.amount)}`,
          `Due date: ${new Date(record.dueDate).toLocaleDateString()}`,
        ],
        actionLabel: "Pay Rent",
        actionPath: "/tenant/rent",
        accent: "#f59e0b",
      });
    }
  } catch (err) {
    console.error("[Scheduler] runRentDueReminders error:", err.message);
  }
};

// ─── job 2: lease expiry alerts ──────────────────────────────────────────────
// Runs every day at 08:30. Checks active leases expiring in exactly 30 days
// or exactly 7 days. Notifies both the owner and the tenant.

const runLeaseExpiryAlerts = async () => {
  try {
    const today = startOfDay(new Date());
    const in30 = startOfDay(addDays(today, 30));
    const in7 = startOfDay(addDays(today, 7));

    const leases = await Lease.find({
      isActive: true,
      leaseEndDate: { $in: [in30, in7] },
    })
      .populate("tenant", "name email")
      .populate("owner", "name email")
      .populate("property", "propertyType address");

    for (const lease of leases) {
      const daysLeft = Math.round((startOfDay(lease.leaseEndDate) - today) / 86400000);
      const label = daysLeft === 7 ? "7 days" : "30 days";

      // Deduplicate: skip if already sent for this lease + daysLeft combo
      const alreadySentTenant = await Notification.findOne({
        recipient: lease.tenant?._id,
        type: "renewal",
        "metadata.leaseId": lease._id,
        "metadata.expiryReminderDays": daysLeft,
      });

      if (!alreadySentTenant) {
        await createNotification({
          recipient: lease.tenant?._id,
          role: "tenant",
          title: "Lease expiring soon",
          message: `Your lease at ${lease.property?.address?.city || "your property"} expires in ${label} on ${new Date(lease.leaseEndDate).toLocaleDateString()}.`,
          type: "renewal",
          actionPath: "/tenant/leases",
          metadata: { leaseId: lease._id, expiryReminderDays: daysLeft },
        });

        await sendMailEvent({
          to: lease.tenant?.email,
          subject: `Lease expiry notice – ${label} remaining`,
          recipientName: lease.tenant?.name,
          heading: `Your lease expires in ${label}`,
          lead: "Your current lease is approaching its end date. Please contact your owner or wait for a renewal proposal.",
          highlights: [
            `Property: ${lease.property?.propertyType || "Property"} (${lease.property?.address?.city || "N/A"})`,
            `Lease end date: ${new Date(lease.leaseEndDate).toLocaleDateString()}`,
          ],
          actionLabel: "View Lease",
          actionPath: "/tenant/leases",
          accent: "#7c3aed",
        });
      }

      const alreadySentOwner = await Notification.findOne({
        recipient: lease.owner?._id,
        type: "renewal",
        "metadata.leaseId": lease._id,
        "metadata.expiryReminderDays": daysLeft,
      });

      if (!alreadySentOwner) {
        await createNotification({
          recipient: lease.owner?._id,
          role: "owner",
          title: "Lease expiring soon",
          message: `Lease for ${lease.tenant?.name || "tenant"} at ${lease.property?.address?.city || "your property"} expires in ${label} on ${new Date(lease.leaseEndDate).toLocaleDateString()}.`,
          type: "renewal",
          actionPath: "/owner/leases",
          metadata: { leaseId: lease._id, expiryReminderDays: daysLeft },
        });

        await sendMailEvent({
          to: lease.owner?.email,
          subject: `Tenant lease expiry – ${label} remaining`,
          recipientName: lease.owner?.name,
          heading: `Tenant lease expires in ${label}`,
          lead: `${lease.tenant?.name || "Your tenant"}'s lease is ending soon. Consider creating a renewal proposal.`,
          highlights: [
            `Tenant: ${lease.tenant?.name || "N/A"}`,
            `Property: ${lease.property?.propertyType || "Property"} (${lease.property?.address?.city || "N/A"})`,
            `Lease end date: ${new Date(lease.leaseEndDate).toLocaleDateString()}`,
          ],
          actionLabel: "Create Renewal",
          actionPath: "/owner/leases",
          accent: "#7c3aed",
        });
      }
    }
  } catch (err) {
    console.error("[Scheduler] runLeaseExpiryAlerts error:", err.message);
  }
};

// ─── job 3: auto mark-overdue ────────────────────────────────────────────────
// Runs every day at 09:00. Automatically marks Pending rent records overdue
// once grace period has passed (mirrors the manual /owner/rent/mark-overdue endpoint).

const runAutoMarkOverdue = async () => {
  try {
    const today = startOfDay(new Date());

    const records = await RentPayment.find({ status: "Pending" })
      .populate("lease")
      .populate("tenant", "name email")
      .populate("property", "propertyType address");

    for (const record of records) {
      const dueDate = startOfDay(record.dueDate);
      const graceDays = normalizeGraceDays(record.lease?.graceDays || 0);
      const overdueStartsOn = addDays(dueDate, graceDays + 1);

      if (today < overdueStartsOn) continue;

      const lateType = record.lease?.lateFeeType || "fixed";
      const lateValue = Number(record.lease?.lateFeeValue || 0);
      const lateFeeAmount =
        lateType === "percent"
          ? Number(((record.amount * lateValue) / 100).toFixed(2))
          : lateValue;

      record.status = "Overdue";
      record.lateFeeAmount = lateFeeAmount;
      record.totalAmount = Number((Number(record.amount || 0) + lateFeeAmount).toFixed(2));
      await record.save();

      await createNotification({
        recipient: record.tenant?._id,
        role: "tenant",
        title: "Rent is overdue",
        message: `${record.month} ${record.year} rent is overdue. Late fee: ${formatCurrency(lateFeeAmount)}.`,
        type: "rent",
        actionPath: "/tenant/rent",
        metadata: { rentId: record._id },
      });

      await sendMailEvent({
        to: record.tenant?.email,
        subject: `Rent overdue: ${record.month} ${record.year}`,
        recipientName: record.tenant?.name,
        heading: "Your rent payment is overdue",
        lead: "Your rent has passed its due date and grace period. Please make payment as soon as possible.",
        highlights: [
          `Month: ${record.month} ${record.year}`,
          `Rent amount: ${formatCurrency(record.amount)}`,
          `Late fee: ${formatCurrency(lateFeeAmount)}`,
          `Total due: ${formatCurrency(record.totalAmount)}`,
        ],
        actionLabel: "Pay Now",
        actionPath: "/tenant/rent",
        accent: "#dc2626",
      });
    }
  } catch (err) {
    console.error("[Scheduler] runAutoMarkOverdue error:", err.message);
  }
};

// ─── register all cron jobs ──────────────────────────────────────────────────

const registerScheduledJobs = () => {
  // Rent due reminders – every day at 08:00
  cron.schedule("0 8 * * *", () => {
    console.log("[Scheduler] Running rent due reminders...");
    runRentDueReminders();
  });

  // Lease expiry alerts – every day at 08:30
  cron.schedule("30 8 * * *", () => {
    console.log("[Scheduler] Running lease expiry alerts...");
    runLeaseExpiryAlerts();
  });

  // Auto mark-overdue – every day at 09:00
  cron.schedule("0 9 * * *", () => {
    console.log("[Scheduler] Running auto mark-overdue...");
    runAutoMarkOverdue();
  });

  console.log("[Scheduler] All scheduled jobs registered.");
};

module.exports = { registerScheduledJobs };
