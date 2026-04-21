import React from "react";
import { X } from "lucide-react";

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
export const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => {
  const colorMap = {
    blue:   { grad: "from-blue-500 to-indigo-600",   shadow: "shadow-blue-200",   ring: "ring-blue-100",   text: "text-blue-700",   bg: "bg-blue-50" },
    green:  { grad: "from-emerald-500 to-teal-600",  shadow: "shadow-emerald-200", ring: "ring-emerald-100", text: "text-emerald-700", bg: "bg-emerald-50" },
    red:    { grad: "from-red-500 to-rose-600",      shadow: "shadow-red-200",     ring: "ring-red-100",     text: "text-red-700",     bg: "bg-red-50" },
    yellow: { grad: "from-amber-400 to-orange-500",  shadow: "shadow-amber-200",   ring: "ring-amber-100",   text: "text-amber-700",   bg: "bg-amber-50" },
    purple: { grad: "from-purple-500 to-violet-600", shadow: "shadow-purple-200",  ring: "ring-purple-100",  text: "text-purple-700",  bg: "bg-purple-50" },
    gray:   { grad: "from-gray-400 to-slate-500",    shadow: "shadow-gray-200",    ring: "ring-gray-100",    text: "text-gray-600",    bg: "bg-gray-50" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4
        shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.10)]
        transition-all duration-250 group ring-1 ${c.ring}`}>
      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${c.grad} shadow-lg ${c.shadow}
          group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-extrabold mt-0.5 ${c.text}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{subtitle}</p>}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
const STATUS_MAP = {
  Paid:          { cls: "badge-green",  dot: "bg-emerald-500" },
  Pending:       { cls: "badge-yellow", dot: "bg-amber-400" },
  Overdue:       { cls: "badge-red",    dot: "bg-red-500" },
  Open:          { cls: "badge-red",    dot: "bg-red-500" },
  "In Progress": { cls: "badge-yellow", dot: "bg-amber-400" },
  Resolved:      { cls: "badge-green",  dot: "bg-emerald-500" },
  Occupied:      { cls: "badge-blue",   dot: "bg-blue-500" },
  Vacant:        { cls: "badge-gray",   dot: "bg-gray-400" },
  Active:        { cls: "badge-green",  dot: "bg-emerald-500" },
  Inactive:      { cls: "badge-gray",   dot: "bg-gray-400" },
  Approved:      { cls: "badge-green",  dot: "bg-emerald-500" },
  Rejected:      { cls: "badge-red",    dot: "bg-red-500" },
  Completed:     { cls: "badge-blue",   dot: "bg-blue-500" },
  Cancelled:     { cls: "badge-gray",   dot: "bg-gray-400" },
  Accepted:      { cls: "badge-green",  dot: "bg-emerald-500" },
  New:           { cls: "badge-purple", dot: "bg-purple-500" },
  Contacted:     { cls: "badge-blue",   dot: "bg-blue-500" },
  "Visit Planned": { cls: "badge-purple", dot: "bg-violet-500" },
  Visited:       { cls: "badge-blue",   dot: "bg-cyan-500" },
  Handled:       { cls: "badge-green",  dot: "bg-emerald-500" },
  Closed:        { cls: "badge-gray",   dot: "bg-gray-400" },
};

export const StatusBadge = ({ status }) => {
  const { cls, dot } = STATUS_MAP[status] || { cls: "badge-gray", dot: "bg-gray-400" };
  return (
    <span className={`${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────── */
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-7 gap-4">
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{title}</h1>
      {subtitle && <p className="text-gray-500 text-sm mt-1.5 leading-relaxed max-w-xl">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const widthMap = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-3xl" };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${widthMap[size] || widthMap.md}
          max-h-[92vh] overflow-y-auto ring-1 ring-black/8 animate-modal-in`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100
            bg-gradient-to-r from-slate-50 to-white rounded-t-3xl sticky top-0 z-10">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full
                bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500
                transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
export const EmptyState = ({ message, icon: Icon, action }) => (
  <div className="flex flex-col items-center justify-center py-20 select-none">
    {Icon && (
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50
          flex items-center justify-center mb-5 shadow-inner ring-1 ring-gray-200/80">
        <Icon size={40} className="text-gray-300" />
      </div>
    )}
    <p className="text-gray-600 text-base font-semibold">{message}</p>
    <p className="text-gray-400 text-sm mt-1.5">Nothing to display yet.</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   ALERT BANNER  (inline error / warning / info)
───────────────────────────────────────────── */
const ALERT_MAP = {
  error:   { wrap: "border-red-300 bg-red-50",     icon: "text-red-500",    title: "text-red-800",    body: "text-red-700" },
  warning: { wrap: "border-amber-300 bg-amber-50", icon: "text-amber-500",  title: "text-amber-800",  body: "text-amber-700" },
  success: { wrap: "border-emerald-300 bg-emerald-50", icon: "text-emerald-500", title: "text-emerald-800", body: "text-emerald-700" },
  info:    { wrap: "border-blue-300 bg-blue-50",   icon: "text-blue-500",   title: "text-blue-800",   body: "text-blue-700" },
};

export const Alert = ({ type = "error", title, message }) => {
  const s = ALERT_MAP[type] || ALERT_MAP.error;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border-2 ${s.wrap} px-4 py-4`}>
      <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${s.icon}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
      <div>
        {title && <p className={`font-bold text-sm ${s.title}`}>{title}</p>}
        {message && <p className={`text-sm mt-0.5 ${s.body}`}>{message}</p>}
      </div>
    </div>
  );
};

