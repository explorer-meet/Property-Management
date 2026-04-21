import React, { useEffect, useState } from "react";
import { BellRing, CalendarClock, CheckCircle2, MessageCircle, Phone, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader, StatusBadge } from "../../components/UI";
import api from "../../utils/api";

const TenantInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingVisitId, setRequestingVisitId] = useState(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await api.get("/tenant/inquiries");
        setInquiries(data?.inquiries || []);
      } catch {
        toast.error("Failed to load inquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const upcomingVisits = inquiries.filter((item) => item.status === "Visit Planned" && item.visitScheduledAt);

  const handleRequestRevisit = async (inquiryId) => {
    setRequestingVisitId(inquiryId);
    try {
      await api.patch(`/tenant/inquiries/${inquiryId}/request-revisit`);
      toast.success("Revisit request sent to owner!");
      const { data } = await api.get("/tenant/inquiries");
      setInquiries(data?.inquiries || []);
    } catch {
      toast.error("Failed to send revisit request.");
    } finally {
      setRequestingVisitId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Inquiries"
        subtitle="Track owner updates, visit schedules, and final inquiry outcomes"
      />

      {upcomingVisits.length > 0 ? (
        <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-violet-800"><BellRing size={16} /> Visit Alert</p>
              <p className="mt-1 text-sm text-violet-700">You have {upcomingVisits.length} scheduled property visit{upcomingVisits.length === 1 ? "" : "s"}. Check details below.</p>
            </div>
            <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700">Upcoming</span>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={18} className="text-cyan-600" /> Property Inquiry History
          </h3>
          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">{inquiries.length} total</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">You have not sent any inquiry yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-cyan-50/40 p-3.5 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {inquiry.property?.propertyType || "Property"} - {inquiry.property?.address?.city || "N/A"}
                      </p>
                      <StatusBadge status={inquiry.status || "New"} />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">Owner: {inquiry.owner?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Email: {inquiry.owner?.email || "N/A"}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.owner?.phone || "N/A"}</p>
                    {inquiry.message ? (
                      <p className="mt-2 rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1.5 text-xs text-cyan-700">
                        {inquiry.message}
                      </p>
                    ) : null}
                    {inquiry.visitScheduledAt ? (
                      <p className="mt-2 rounded-lg border border-violet-100 bg-violet-50 px-2 py-1.5 text-xs text-violet-700 inline-flex items-center gap-1">
                        <CalendarClock size={12} /> Scheduled visit: {new Date(inquiry.visitScheduledAt).toLocaleString()}
                      </p>
                    ) : null}
                    {inquiry.visitedAt ? (
                      <p className="mt-2 rounded-lg border border-teal-100 bg-teal-50 px-2 py-1.5 text-xs text-teal-700 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Visit marked complete on {new Date(inquiry.visitedAt).toLocaleString()}
                      </p>
                    ) : null}
                    {inquiry.status === "Visited" || inquiry.revisitRequested ? (
                      inquiry.revisitRequested ? (
                        <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5 text-xs text-amber-700 inline-flex items-center gap-1">
                          <RefreshCw size={12} /> Revisit requested — awaiting owner confirmation
                        </p>
                      ) : (
                        <button
                          onClick={() => handleRequestRevisit(inquiry._id)}
                          disabled={requestingVisitId === inquiry._id}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                        >
                          <RefreshCw size={12} /> {requestingVisitId === inquiry._id ? "Requesting..." : "Request Another Visit"}
                        </button>
                      )
                    ) : null}
                    {inquiry.ownerFollowUpNote ? (
                      <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
                        Follow-up note: {inquiry.ownerFollowUpNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500">Sent on {new Date(inquiry.createdAt).toLocaleString()}</p>
                    <p className="text-[11px] text-gray-500">Last updated {new Date(inquiry.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TenantInquiries;
