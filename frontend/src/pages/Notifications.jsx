import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, ChevronLeft, ChevronRight, UserCircle2 } from "lucide-react";
import { EmptyState } from "../components/UI";
import api from "../utils/api";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const TYPE_LABELS = {
  rent: "Rent",
  maintenance: "Maintenance",
  moveout: "Move-Out",
  renewal: "Renewal",
  compliance: "Compliance",
  inquiry: "Inquiry",
  system: "System",
};

const typeTone = {
  rent: "border-amber-200 bg-amber-50 text-amber-800",
  maintenance: "border-blue-200 bg-blue-50 text-blue-800",
  moveout: "border-rose-200 bg-rose-50 text-rose-800",
  renewal: "border-emerald-200 bg-emerald-50 text-emerald-800",
  compliance: "border-indigo-200 bg-indigo-50 text-indigo-800",
  inquiry: "border-cyan-200 bg-cyan-50 text-cyan-800",
  system: "border-gray-200 bg-gray-50 text-gray-800",
};

const typeIconBg = {
  rent: "from-amber-400 to-yellow-500",
  maintenance: "from-blue-400 to-cyan-500",
  moveout: "from-rose-400 to-pink-500",
  renewal: "from-emerald-400 to-teal-500",
  compliance: "from-indigo-400 to-violet-500",
  inquiry: "from-cyan-400 to-blue-500",
  system: "from-gray-400 to-slate-500",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);
  useEffect(() => { setPage(1); }, [categoryFilter, readFilter, tenantFilter]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      toast.error("Unable to mark notification as read.");
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };



  const uniqueTenants = useMemo(() => {
    const names = notifications.map((n) => n.senderName).filter(Boolean);
    return [...new Set(names)].sort();
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== "all" && n.type !== categoryFilter) return false;
      if (readFilter === "unread" && n.isRead) return false;
      if (readFilter === "read" && !n.isRead) return false;
      if (tenantFilter !== "all" && n.senderName !== tenantFilter) return false;
      return true;
    });
  }, [notifications, categoryFilter, readFilter, tenantFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-5">

      {/* ── Combined Hero Header ── */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-5 shadow-[0_8px_24px_rgba(59,130,246,0.10)]">
        {/* Top row: title + unread badge + mark-all-read */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Notifications</h1>
              <p className="text-xs text-gray-500">Recent updates across rent, maintenance, renewal and compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-xl border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
              {notifications.length} Total
            </div>
            {unreadCount > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                {unreadCount} Unread
              </div>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <CheckCircle2 size={13} /> Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-blue-100 pt-4">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          >
            <option value="all">All Categories</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Tenant */}
          {uniqueTenants.length > 0 && (
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            >
              <option value="all">All Tenants</option>
              {uniqueTenants.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          {/* Read / Unread toggle */}
          <div className="flex rounded-lg border border-blue-200 overflow-hidden text-xs font-semibold shadow-sm">
            {[["all", "All"], ["unread", "Unread"], ["read", "Read"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setReadFilter(val)}
                className={`px-3 py-1.5 transition-colors ${
                  readFilter === val
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-blue-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Active filter count + clear */}
          {(categoryFilter !== "all" || tenantFilter !== "all" || readFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setCategoryFilter("all"); setTenantFilter("all"); setReadFilter("all"); }}
              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 ml-auto"
            >
              Clear Filters ×
            </button>
          )}

          {/* Result count chip (right-aligned when no clear button) */}
          {categoryFilter === "all" && tenantFilter === "all" && readFilter === "all" && (
            <span className="ml-auto rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 shadow-sm">
              {filtered.length} shown
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No notifications match your filters." icon={Bell} />
      ) : (
        <>
          <div className="space-y-2.5">
            {paginated.map((item) => (
              <div
                key={item._id}
                className={`rounded-xl border px-4 py-3.5 transition-all hover:shadow-md ${item.isRead ? "border-gray-100 bg-white" : "border-blue-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/40"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br ${typeIconBg[item.type] || typeIconBg.system} flex items-center justify-center shadow-sm`}>
                    {item.senderName ? (
                      <span className="text-[11px] font-bold text-white">{getInitials(item.senderName)}</span>
                    ) : (
                      <UserCircle2 size={16} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${typeTone[item.type] || typeTone.system}`}>
                            {TYPE_LABELS[item.type] || "System"}
                          </span>
                          {!item.isRead ? <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" title="Unread" /> : null}
                        </div>
                        {item.senderName ? <p className="text-xs font-medium text-gray-500">From: {item.senderName}</p> : null}
                        <p className="text-sm text-gray-600">{item.message}</p>
                        <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap flex-shrink-0">
                        {!item.isRead ? (
                          <button
                            type="button"
                            onClick={() => markRead(item._id)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle2 size={12} /> Mark Read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-[30px] rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${page === p ? "border-blue-400 bg-blue-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;
