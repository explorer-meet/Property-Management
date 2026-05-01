import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Calendar,
  DoorOpen,
  Wrench,
  Wallet,
  AlertTriangle,
  Phone,
  Mail,
  BellRing,
  Bell,
  Clock3,
  Siren,
  ScrollText,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { Modal, StatusBadge } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const TenantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [rentHistory, setRentHistory] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [{ data: res }, { data: rentRes }, { data: maintenanceRes }, { data: moveOutRes }, { data: inquiryRes }, { data: notificationRes }] = await Promise.all([
          api.get("/tenant/dashboard"),
          api.get("/tenant/rent-history"),
          api.get("/tenant/maintenance"),
          api.get("/tenant/move-out"),
          api.get("/tenant/inquiries"),
          api.get("/notifications"),
        ]);

        setData(res);

        const lease = res?.lease;
        const rents = rentRes?.rents || [];
        const requests = maintenanceRes?.requests || [];
        const moveOutHistory = moveOutRes?.requests || [];

        setRentHistory(rents);
        setMaintenanceRequests(requests);
        setMoveOutRequests(moveOutHistory);
        setInquiries(inquiryRes?.inquiries || []);
        setNotifications(notificationRes?.notifications || []);

        const now = new Date();
        const within7Days = new Date();
        within7Days.setDate(now.getDate() + 7);
        const within30Days = new Date();
        within30Days.setDate(now.getDate() + 30);

        const overdueRents = rents.filter((rent) => rent.status === "Overdue");
        const dueSoonRents = rents.filter((rent) => {
          if (rent.status !== "Pending") return false;
          const dueDate = new Date(rent.dueDate);
          return dueDate >= now && dueDate <= within7Days;
        });

        const openRequests = requests.filter((req) => ["Open", "In Progress"].includes(req.status));
        const highPriorityRequests = openRequests.filter((req) => ["High", "Emergency"].includes(req.urgency));

        const leaseEndSoon = lease?.leaseEndDate
          ? new Date(lease.leaseEndDate) >= now && new Date(lease.leaseEndDate) <= within30Days
          : false;

        const nextAlerts = [];

        if (overdueRents.length > 0) {
          const overdueAmount = overdueRents.reduce((sum, rent) => sum + Number(rent.amount || 0), 0);
          nextAlerts.push({
            id: "overdue-rent",
            tone: "red",
            icon: Siren,
            title: `${overdueRents.length} overdue rent record${overdueRents.length > 1 ? "s" : ""}`,
            detail: `${formatCurrency(overdueAmount)} is overdue. Consider clearing this first.`,
            actionLabel: "Open Rent",
            onAction: () => navigate("/tenant/rent"),
          });
        }

        if (dueSoonRents.length > 0) {
          nextAlerts.push({
            id: "rent-due-soon",
            tone: "blue",
            icon: Clock3,
            title: `${dueSoonRents.length} rent payment${dueSoonRents.length > 1 ? "s" : ""} due this week`,
            detail: "Pay early to avoid overdue penalties.",
            actionLabel: "View Due Rent",
            onAction: () => navigate("/tenant/rent"),
          });
        }

        if (leaseEndSoon) {
          nextAlerts.push({
            id: "lease-end-soon",
            tone: "amber",
            icon: ScrollText,
            title: "Lease ending within 30 days",
            detail: "Coordinate with your owner for renewal or move-out planning.",
            actionLabel: "Review Lease",
            onAction: () => navigate("/tenant/dashboard"),
          });
        }

        if (highPriorityRequests.length > 0) {
          nextAlerts.push({
            id: "urgent-maintenance",
            tone: "violet",
            icon: BellRing,
            title: `${highPriorityRequests.length} urgent maintenance request${highPriorityRequests.length > 1 ? "s" : ""} open`,
            detail: "Track updates and comments from your owner.",
            actionLabel: "Open Requests",
            onAction: () => navigate("/tenant/maintenance"),
          });
        } else if (openRequests.length > 0) {
          nextAlerts.push({
            id: "open-maintenance",
            tone: "blue",
            icon: Wrench,
            title: `${openRequests.length} maintenance request${openRequests.length > 1 ? "s" : ""} in progress`,
            detail: "You can add updates or photos in My Requests.",
            actionLabel: "My Requests",
            onAction: () => navigate("/tenant/maintenance"),
          });
        }

        setAlerts(nextAlerts);
      } catch {
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const lease = data?.lease;
  const stats = data?.stats;
  const paidRent = rentHistory
    .filter((rent) => rent.status === "Paid")
    .reduce((sum, rent) => sum + Number(rent.amount || 0), 0);
  const pendingRentByHistory = rentHistory
    .filter((rent) => rent.status === "Pending")
    .reduce((sum, rent) => sum + Number(rent.amount || 0), 0);
  const overdueRentByHistory = rentHistory
    .filter((rent) => rent.status === "Overdue")
    .reduce((sum, rent) => sum + Number(rent.amount || 0), 0);

  const pendingRent = Number(stats?.pendingRent || pendingRentByHistory || 0);
  const overdueRent = Number(stats?.overdueRent || overdueRentByHistory || 0);
  const openRequests = maintenanceRequests.filter((req) => ["Open", "In Progress"].includes(req.status)).length;
  const payableRent = pendingRent + overdueRent;

  const maintenanceStatusCount = maintenanceRequests.reduce((acc, req) => {
    const key = req.status || "Open";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const totalMaintenanceRequests = maintenanceRequests.length;
  const closedMaintenance = Number(maintenanceStatusCount.Resolved || 0) + Number(maintenanceStatusCount.Closed || 0);
  const openMaintenance = Number(maintenanceStatusCount.Open || 0) + Number(maintenanceStatusCount["In Progress"] || 0);

  const inquiryClosedCount = inquiries.filter((inq) => (inq.status || "") === "Closed").length;

  const monthlyLeaseRent = Number(lease?.rentAmount || 0);
  const leaseDaysRemaining = lease?.leaseEndDate
    ? Math.max(0, Math.ceil((new Date(lease.leaseEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  const projectedMonthsRemaining = Math.ceil(leaseDaysRemaining / 30);
  const projectedFutureRent = projectedMonthsRemaining > 0 ? projectedMonthsRemaining * monthlyLeaseRent : 0;

  const totalTrackedRent = paidRent + pendingRent + overdueRent;
  const activeLeaseCount = lease?.isActive === false ? 0 : lease ? 1 : 0;
  const moveOutPendingCount = moveOutRequests.filter((r) => r.status === "Pending").length;
  const moveOutApprovedCount = moveOutRequests.filter((r) => r.status === "Approved").length;
  const moveOutCancelledCount = moveOutRequests.filter((r) => r.status === "Cancelled").length;
  const moveOutCompletedCount = moveOutRequests.filter((r) => r.status === "Completed").length;
  const openInquiryCount = inquiries.filter((inq) => ["New", "In Progress"].includes(inq.status || "New")).length;
  const tenantDisplayName = user?.firstName || user?.name?.split(" ")?.[0] || "there";
  const unreadNotificationCount = notifications.filter((item) => !item?.isRead).length;
  const readNotificationCount = notifications.filter((item) => item?.isRead).length;

  const markTenantNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-cyan-150 pb-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-blob-delay" />
      <div className="relative z-10 space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-7 sm:px-8 shadow-2xl animate-fade-up">
        <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-blue-400/20 blur-2xl animate-blob" />
        <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl animate-blob-delay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-blue-200 font-semibold">Welcome Back</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">Hi {tenantDisplayName}, manage your tenancy with clarity</h1>
            <p className="mt-2 text-sm text-blue-100 max-w-xl">
              Track rent dues, maintenance requests, lease timeline, and property details from one clean dashboard without duplicate navigation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Total Payable</p>
            <p className="mt-2 text-3xl font-extrabold">{formatCurrency(payableRent)}</p>
            <p className="mt-1 text-xs text-blue-100">Pending + overdue combined</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-[0_8px_22px_rgba(251,191,36,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Rent</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-700">{formatCurrency(pendingRent)}</p>
          <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><Wallet size={12} /> Awaiting payment</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-5 shadow-[0_8px_22px_rgba(239,68,68,0.10)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overdue Rent</p>
          <p className="mt-2 text-3xl font-extrabold text-red-700">{formatCurrency(overdueRent)}</p>
          <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><AlertTriangle size={12} /> Needs immediate action</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/tenant/maintenance")}
          className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-[0_8px_22px_rgba(59,130,246,0.12)] text-left hover:shadow-[0_14px_28px_rgba(59,130,246,0.22)] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Open Requests</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700">{openRequests}</p>
          <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><Wrench size={12} /> Maintenance in progress</p>
        </button>
      </div>

      {/* ── Analytics Charts Row ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {/* Rent Collection: Paid vs Pending vs Overdue */}
        {(() => {
          const rentCollectionData = [
            { name: "Paid", value: paidRent, color: "#10b981" },
            { name: "Pending", value: pendingRent, color: "#f59e0b" },
            { name: "Overdue", value: overdueRent, color: "#ef4444" },
          ].filter((item) => item.value > 0);
          const chartData = rentCollectionData.length ? rentCollectionData : [{ name: "No Records", value: 1, color: "#cbd5e1" }];
          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg"><Wallet size={16} className="text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Rent Collection</p>
                  <p className="text-xs text-gray-400">Paid vs due split</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                <div className="flex justify-between text-emerald-700"><span>Paid</span><span className="font-semibold">{formatCurrency(paidRent)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Pending</span><span className="font-semibold">{formatCurrency(pendingRent)}</span></div>
                <div className="flex justify-between text-red-700"><span>Overdue</span><span className="font-semibold">{formatCurrency(overdueRent)}</span></div>
                <div className="flex justify-between border-t border-gray-100 pt-1 text-gray-700"><span>Total Tracked</span><span className="font-bold">{formatCurrency(totalTrackedRent)}</span></div>
              </div>
            </div>
          );
        })()}

        {/* Lease Projection: Completed vs Future */}
        {(() => {
          const projectionData = [
            { name: "Paid To Date", value: paidRent, color: "#2563eb" },
            { name: "Future Lease Projection", value: projectedFutureRent, color: "#a855f7" },
            { name: "Outstanding Dues", value: payableRent, color: "#f97316" },
          ].filter((item) => item.value > 0);
          const chartData = projectionData.length ? projectionData : [{ name: "No Lease Data", value: 1, color: "#cbd5e1" }];
          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-violet-50 rounded-lg"><Calendar size={16} className="text-violet-600" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Lease Projection</p>
                  <p className="text-xs text-gray-400">Future rent estimate</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-700">
                <div className="flex justify-between"><span>Monthly Lease Rent</span><span className="font-semibold">{formatCurrency(monthlyLeaseRent)}</span></div>
                <div className="flex justify-between"><span>Projected Months Left</span><span className="font-semibold">{projectedMonthsRemaining}</span></div>
                <div className="flex justify-between"><span>Projected Future Rent</span><span className="font-semibold text-violet-700">{formatCurrency(projectedFutureRent)}</span></div>
              </div>
            </div>
          );
        })()}

        {/* Request Portfolio: Maintenance + Inquiries */}
        {(() => {
          const requestMixData = [
            { name: "Maintenance Open", value: openMaintenance, color: "#f59e0b" },
            { name: "Maintenance Closed", value: closedMaintenance, color: "#10b981" },
            { name: "Inquiry Open", value: openInquiryCount, color: "#3b82f6" },
            { name: "Inquiry Closed", value: inquiryClosedCount, color: "#6b7280" },
          ].filter((item) => item.value > 0);
          const chartData = requestMixData.length ? requestMixData : [{ name: "No Requests", value: 1, color: "#cbd5e1" }];
          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg"><Wrench size={16} className="text-blue-600" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Request Portfolio</p>
                  <p className="text-xs text-gray-400">Maintenance and inquiry load</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} request${value === 1 ? "" : "s"}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
                <div className="flex justify-between"><span>Maint. total</span><span className="font-semibold">{totalMaintenanceRequests}</span></div>
                <div className="flex justify-between"><span>Maint. open</span><span className="font-semibold text-amber-700">{openMaintenance}</span></div>
                <div className="flex justify-between"><span>Inquiry total</span><span className="font-semibold">{inquiries.length}</span></div>
                <div className="flex justify-between"><span>Inquiry open</span><span className="font-semibold text-blue-700">{openInquiryCount}</span></div>
              </div>
            </div>
          );
        })()}

        {/* Active Lease + Move-Out Tracker */}
        {(() => {
          const leaseMoveOutData = [
            { name: "Active Lease", value: activeLeaseCount, color: "#10b981" },
            { name: "Move-Out Pending", value: moveOutPendingCount, color: "#f59e0b" },
            { name: "Move-Out Approved", value: moveOutApprovedCount, color: "#2563eb" },
            { name: "Move-Out Cancelled", value: moveOutCancelledCount, color: "#6b7280" },
            { name: "Move-Out Completed", value: moveOutCompletedCount, color: "#8b5cf6" },
          ].filter((item) => item.value > 0);

          const chartData = leaseMoveOutData.length ? leaseMoveOutData : [{ name: "No Lease/Move-Out", value: 1, color: "#cbd5e1" }];

          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-rose-50 rounded-lg"><DoorOpen size={16} className="text-rose-600" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Lease & Move-Out Tracker</p>
                  <p className="text-xs text-gray-400">Lease status and move-out flow</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} item${value === 1 ? "" : "s"}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-700">
                <div className="flex justify-between"><span>Active Lease</span><span className="font-semibold text-emerald-700">{activeLeaseCount}</span></div>
                <div className="flex justify-between"><span>Move-Out Pending</span><span className="font-semibold text-amber-700">{moveOutPendingCount}</span></div>
                <div className="flex justify-between"><span>Move-Out Approved</span><span className="font-semibold text-blue-700">{moveOutApprovedCount}</span></div>
                <div className="flex justify-between"><span>Move-Out Cancelled</span><span className="font-semibold text-gray-700">{moveOutCancelledCount}</span></div>
                <div className="flex justify-between"><span>Move-Out Completed</span><span className="font-semibold text-violet-700">{moveOutCompletedCount}</span></div>
              </div>
            </div>
          );
        })()}

        {(() => {
          const notificationData = [
            { name: "Unread", value: unreadNotificationCount, color: "#f59e0b" },
            { name: "Read", value: readNotificationCount, color: "#10b981" },
          ].filter((item) => item.value > 0);
          const chartData = notificationData.length ? notificationData : [{ name: "No Notifications", value: 1, color: "#cbd5e1" }];

          return (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 rounded-lg"><BellRing size={16} className="text-amber-600" /></div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Notifications Pulse</p>
                  <p className="text-xs text-gray-400">Read vs unread split</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} notification${value === 1 ? "" : "s"}`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-700">
                <div className="flex justify-between"><span>Unread</span><span className="font-semibold text-amber-700">{unreadNotificationCount}</span></div>
                <div className="flex justify-between"><span>Read</span><span className="font-semibold text-emerald-700">{readNotificationCount}</span></div>
                <button
                  type="button"
                  onClick={() => navigate("/tenant/notifications")}
                  className="mt-2 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Open Notifications
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <DoorOpen size={18} className="text-indigo-600" /> Tenancy Impact Board
            </h3>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600">Live Status</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Financial Pressure</p>
              <p className="text-lg font-bold text-emerald-800 mt-1">{formatCurrency(payableRent)}</p>
              <p className="text-xs text-emerald-700 mt-1">Pending + overdue dues to clear</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3.5">
              <p className="text-xs uppercase tracking-wider text-amber-700 font-semibold">Maintenance Load</p>
              <p className="text-lg font-bold text-amber-800 mt-1">{openMaintenance} open / {totalMaintenanceRequests} total</p>
              <p className="text-xs text-amber-700 mt-1">Pending service tasks impacting comfort</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3.5">
              <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">Owner Communication</p>
              <p className="text-lg font-bold text-blue-800 mt-1">{openInquiryCount} active inquiry threads</p>
              <p className="text-xs text-blue-700 mt-1">Open threads waiting for progress/closure</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3.5">
              <p className="text-xs uppercase tracking-wider text-violet-700 font-semibold">Move-Out Pipeline</p>
              <p className="text-lg font-bold text-violet-800 mt-1">{moveOutPendingCount + moveOutApprovedCount} in review</p>
              <p className="text-xs text-violet-700 mt-1">Pending + approved move-out requests</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={17} className="text-cyan-600" /> Quick Actions
          </h3>
          <div className="mt-3 space-y-2.5">
            <button type="button" onClick={() => navigate("/tenant/leases")} className="w-full rounded-lg border border-white/80 bg-white/85 px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white">
              Open My Leases
            </button>
            <button type="button" onClick={() => navigate("/tenant/rent")} className="w-full rounded-lg border border-white/80 bg-white/85 px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white">
              Pay / Track Rent
            </button>
            <button type="button" onClick={() => navigate("/tenant/maintenance")} className="w-full rounded-lg border border-white/80 bg-white/85 px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white">
              Manage Maintenance
            </button>
            <button type="button" onClick={() => navigate("/tenant/move-out")} className="w-full rounded-lg border border-white/80 bg-white/85 px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-white">
              Track Move-Out Requests
            </button>
            <button type="button" onClick={() => navigate("/tenant/notifications")} className="w-full rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-left text-sm font-medium text-amber-800 hover:bg-amber-100">
              Notifications ({unreadNotificationCount} unread)
            </button>
          </div>
        </div>
      </section>

      <section id="tenant-inquiries-section" className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <BellRing size={18} className="text-blue-600" /> Smart Alerts
          </h3>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {alerts.length} active
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            You are all caught up. No urgent tenancy alerts at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              const toneClasses = {
                red: "border-red-100 bg-red-50 text-red-700",
                amber: "border-amber-100 bg-amber-50 text-amber-700",
                blue: "border-blue-100 bg-blue-50 text-blue-700",
                violet: "border-violet-100 bg-violet-50 text-violet-700",
              };

              return (
                <div key={alert.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 ${toneClasses[alert.tone] || toneClasses.blue}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        <p className="mt-1 text-xs text-gray-600">{alert.detail}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={alert.onAction}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {alert.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Recent Notifications ── */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Bell size={17} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Notifications</h3>
              <p className="text-xs text-gray-500">{unreadNotificationCount} unread</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/tenant/notifications")}
            className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            View All
          </button>
        </div>
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${n.isRead ? "border-gray-100 bg-white" : "border-blue-200 bg-blue-50"}`}
              >
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-gray-300" : "bg-blue-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.actionPath ? (
                    <button
                      type="button"
                      onClick={() => { navigate(n.actionPath); markTenantNotificationRead(n._id); }}
                      className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Go
                    </button>
                  ) : null}
                  {!n.isRead ? (
                    <button
                      type="button"
                      onClick={() => markTenantNotificationRead(n._id)}
                      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={18} className="text-cyan-600" /> My Property Inquiries
          </h3>
          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">
            {inquiries.length} total
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            You have not sent any property inquiry yet. Explore listings on the landing page and click Interested.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {inquiries.slice(0, 6).map((inquiry) => (
              <div key={inquiry._id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-cyan-50/40 p-3.5 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {inquiry.property?.propertyType || "Property"} - {[
                        inquiry.property?.address?.street,
                        inquiry.property?.address?.city,
                        inquiry.property?.address?.state,
                        inquiry.property?.address?.pincode,
                      ].filter(Boolean).join(", ") || "Address not available"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Owner: {inquiry.owner?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Email: {inquiry.owner?.email || "N/A"}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.owner?.phone || "N/A"}</p>
                    {inquiry.message ? (
                      <p className="mt-2 rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1.5 text-xs text-cyan-700">
                        {inquiry.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500">Sent on {new Date(inquiry.createdAt).toLocaleString()}</p>
                    <span className={`inline-flex w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      inquiry.status === "Closed"
                        ? "border-gray-200 bg-gray-100 text-gray-700"
                        : inquiry.status === "Contacted"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                      : inquiry.status === "In Progress"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                      {inquiry.status || "New"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      </div>
    </div>
  );
};

export default TenantDashboard;



