import React, { useEffect, useState } from "react";
import { CalendarCheck2, MessageCircle, Pencil, Phone, Save } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, StatusBadge } from "../../components/UI";
import api from "../../utils/api";

const STATUS_OPTIONS = ["New", "In Progress", "Contacted", "Visit Planned", "Visited", "Closed"];

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const defaultVisitDateTime = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(22, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T22:00`;
};

const OwnerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingInquiryId, setUpdatingInquiryId] = useState("");
  const [visitDraftByInquiry, setVisitDraftByInquiry] = useState({});
  const [followUpByInquiry, setFollowUpByInquiry] = useState({});
  const [statusFilter, setStatusFilter] = useState(null);
  const [editingFollowUpId, setEditingFollowUpId] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await api.get("/owner/inquiries");
        setInquiries(data?.inquiries || []);
      } catch {
        toast.error("Failed to load inquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const updateStatus = async (inquiryId, status, extra = {}) => {
    try {
      setUpdatingInquiryId(inquiryId);
      const { data } = await api.patch(`/owner/inquiries/${inquiryId}/status`, { status, ...extra });
      setInquiries((prev) => prev.map((item) => (item._id === inquiryId ? data.inquiry : item)));
      toast.success("Inquiry updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update inquiry status.");
    } finally {
      setUpdatingInquiryId("");
    }
  };

  const handlePlanVisit = (inquiry) => {
    const currentDraft = visitDraftByInquiry[inquiry._id] || {};
    const visitScheduledAt = currentDraft.visitScheduledAt || toLocalDateTime(inquiry.visitScheduledAt) || defaultVisitDateTime();

    if (!visitScheduledAt) {
      toast.error("Please choose visit date and time.");
      return;
    }

    updateStatus(inquiry._id, "Visit Planned", {
      visitScheduledAt,
      visitNote: currentDraft.visitNote || "",
    });
  };

  const stats = {
    total: inquiries.length,
    newItems: inquiries.filter((item) => item.status === "New").length,
    inProgress: inquiries.filter((item) => item.status === "In Progress").length,
    contacted: inquiries.filter((item) => item.status === "Contacted").length,
    visitPlanned: inquiries.filter((item) => item.status === "Visit Planned").length,
    visited: inquiries.filter((item) => item.status === "Visited").length,
    closed: inquiries.filter((item) => item.status === "Closed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Inquiries"
        subtitle="Plan visits, notify users, track visit updates, and mark inquiries as handled"
      />

      <section className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-5 shadow-[0_10px_30px_rgba(14,116,144,0.12)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Fresh Leads", sub: "New", value: stats.newItems, filter: "New", active: "border-amber-400 bg-amber-50", idle: "border-amber-100 bg-white/90", text: "text-amber-700", count: "text-amber-900", hint: "text-amber-600" },
            { label: "In Progress", sub: "Active", value: stats.inProgress, filter: "In Progress", active: "border-blue-400 bg-blue-50", idle: "border-blue-100 bg-white/90", text: "text-blue-700", count: "text-blue-900", hint: "text-blue-600" },
            { label: "Contacted", sub: "Reached out", value: stats.contacted, filter: "Contacted", active: "border-cyan-400 bg-cyan-50", idle: "border-cyan-100 bg-white/90", text: "text-cyan-700", count: "text-cyan-900", hint: "text-cyan-600" },
            { label: "Visit Planned", sub: "Scheduled", value: stats.visitPlanned, filter: "Visit Planned", active: "border-violet-400 bg-violet-50", idle: "border-violet-100 bg-white/90", text: "text-violet-700", count: "text-violet-900", hint: "text-violet-600" },
            { label: "Visited", sub: "Site seen", value: stats.visited, filter: "Visited", active: "border-teal-400 bg-teal-50", idle: "border-teal-100 bg-white/90", text: "text-teal-700", count: "text-teal-900", hint: "text-teal-600" },
            { label: "Closed", sub: "Completed", value: stats.closed, filter: "Closed", active: "border-gray-400 bg-gray-100", idle: "border-gray-200 bg-white/90", text: "text-gray-600", count: "text-gray-700", hint: "text-gray-500" },
          ].map((card) => {
            const isActive = statusFilter === card.filter;
            return (
              <button
                key={card.filter}
                type="button"
                onClick={() => setStatusFilter(isActive ? null : card.filter)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${isActive ? card.active + " shadow-md ring-1 ring-inset ring-current/20" : card.idle}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider ${card.text}`}>{card.label}</p>
                <p className={`mt-1 text-2xl font-extrabold ${card.count}`}>{card.value}</p>
                <p className={`mt-0.5 text-[10px] ${card.hint}`}>{isActive ? "Click to clear" : card.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={18} className="text-blue-600" /> Inquiry Pipeline
          </h3>
          <div className="flex items-center gap-2">
            {statusFilter ? (
              <button
                type="button"
                onClick={() => setStatusFilter(null)}
                className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                {statusFilter} &times; Clear
              </button>
            ) : null}
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              {statusFilter ? inquiries.filter((i) => i.status === statusFilter).length : inquiries.length} shown
            </span>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">No inquiries received yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[...inquiries]
              .sort((a, b) => {
                if (a.status === "Closed" && b.status !== "Closed") return 1;
                if (a.status !== "Closed" && b.status === "Closed") return -1;
                return 0;
              })
              .filter((i) => !statusFilter || i.status === statusFilter).map((inquiry) => {
              const draft = visitDraftByInquiry[inquiry._id] || {};
              const followUpNote = followUpByInquiry[inquiry._id] || "";

              return (
                <div key={inquiry._id} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {inquiry.property?.propertyType || "Property"} - {inquiry.property?.address?.city || "N/A"}
                        </p>
                        <StatusBadge status={inquiry.status || "New"} />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">Inquirer: {inquiry.inquirer?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">Email: {inquiry.inquirer?.email || "N/A"}</p>
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.inquirer?.phone || "N/A"}</p>
                      {inquiry.message ? (
                        <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
                          {inquiry.message}
                        </p>
                      ) : null}
                      {inquiry.revisitRequested ? (
                        <p className="mt-2 rounded-full inline-flex items-center gap-1.5 border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> Tenant requested another visit
                        </p>
                      ) : null}
                      {inquiry.visitScheduledAt ? (
                        <p className="mt-2 rounded-lg border border-violet-100 bg-violet-50 px-2 py-1.5 text-xs text-violet-700">
                          Visit scheduled: {new Date(inquiry.visitScheduledAt).toLocaleString()}
                        </p>
                      ) : null}
                      {inquiry.visitedAt ? (
                        <p className="mt-2 rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1.5 text-xs text-cyan-700">
                          Visit marked complete on {new Date(inquiry.visitedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>

                    {inquiry.status !== "Closed" && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Plan Property Visit</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="datetime-local"
                          value={draft.visitScheduledAt || toLocalDateTime(inquiry.visitScheduledAt) || defaultVisitDateTime()}
                          onChange={(e) =>
                            setVisitDraftByInquiry((prev) => ({
                              ...prev,
                              [inquiry._id]: { ...(prev[inquiry._id] || {}), visitScheduledAt: e.target.value },
                            }))
                          }
                          className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700"
                        />
                        <input
                          type="text"
                          placeholder="Visit note (meeting point / time preference)"
                          value={draft.visitNote || inquiry.visitNote || ""}
                          onChange={(e) =>
                            setVisitDraftByInquiry((prev) => ({
                              ...prev,
                              [inquiry._id]: { ...(prev[inquiry._id] || {}), visitNote: e.target.value },
                            }))
                          }
                          className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={updatingInquiryId === inquiry._id}
                        onClick={() => handlePlanVisit(inquiry)}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
                      >
                        <CalendarCheck2 size={13} /> Schedule Visit & Notify User
                      </button>
                    </div>
                    )}

                    {inquiry.status !== "Closed" && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Post-Visit Follow-up</p>
                        {editingFollowUpId !== inquiry._id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFollowUpId(inquiry._id);
                              setFollowUpByInquiry((prev) => ({ ...prev, [inquiry._id]: inquiry.ownerFollowUpNote || "" }));
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-100 transition-colors"
                          >
                            <Pencil size={11} /> Edit
                          </button>
                        )}
                      </div>
                      {editingFollowUpId === inquiry._id ? (
                        <>
                          <textarea
                            rows={2}
                            autoFocus
                            placeholder="Add follow-up note after site visit"
                            value={followUpNote}
                            onChange={(e) => setFollowUpByInquiry((prev) => ({ ...prev, [inquiry._id]: e.target.value }))}
                            className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={updatingInquiryId === inquiry._id}
                              onClick={async () => {
                                await updateStatus(inquiry._id, inquiry.status, { ownerFollowUpNote: followUpNote });
                                setEditingFollowUpId(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Save size={12} /> {updatingInquiryId === inquiry._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingFollowUpId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 min-h-[32px] rounded-lg border border-emerald-100 bg-white px-2.5 py-2 text-xs text-gray-600">
                          {inquiry.ownerFollowUpNote || <span className="italic text-gray-400">No follow-up note yet. Click Edit to add one.</span>}
                        </p>
                      )}
                    </div>
                    )}

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-gray-500">Received on {new Date(inquiry.createdAt).toLocaleString()}</p>
                      <select
                        value={inquiry.status || "New"}
                        onChange={(e) => updateStatus(inquiry._id, e.target.value)}
                        disabled={updatingInquiryId === inquiry._id}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerInquiries;
