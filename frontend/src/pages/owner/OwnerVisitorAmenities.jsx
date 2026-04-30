import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/UI";
import api from "../../utils/api";

const OwnerVisitorAmenities = () => {
  const [loading, setLoading] = useState(true);
  const [visitorLogs, setVisitorLogs] = useState([]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [visitorRes] = await Promise.all([api.get("/owner/visitor-logs")]);
      setVisitorLogs(visitorRes.data?.logs || []);
    } catch {
      toast.error("Failed to load guest logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateVisitorStatus = async (id, status) => {
    try {
      await api.patch(`/owner/visitor-logs/${id}/status`, { status });
      toast.success("Visitor status updated.");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update visitor status.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest Logs"
        subtitle="Owner-only visitor records generated from inquiry visit planning and completion"
      />

      {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}

      <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
        <h3 className="text-sm font-bold text-cyan-900">Guest / Visitor Logs</h3>
        <div className="mt-3 space-y-2">
          {visitorLogs.length === 0 ? <p className="text-sm text-gray-500">No visitor logs yet.</p> : null}
          {visitorLogs.map((log) => (
            <div key={log._id} className="rounded-lg border border-cyan-100 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{log.visitorName}</p>
                  <p className="text-xs text-gray-600">{new Date(log.visitDate).toLocaleDateString()} • {log.purpose || "Visit"}</p>
                  <p className="text-xs text-gray-500">Tenant: {log.tenant?.name || "N/A"} • {log.property?.address?.city || "N/A"}</p>
                  {log.checkInAt ? (
                    <p className="mt-1 text-xs font-semibold text-cyan-700">Check-In: {new Date(log.checkInAt).toLocaleString()}</p>
                  ) : null}
                  {log.checkOutAt ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">Check-Out: {new Date(log.checkOutAt).toLocaleString()}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => updateVisitorStatus(log._id, "Checked-In")}
                    disabled={log.status !== "Expected"}
                  >
                    Check-In
                  </button>
                  <button
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => updateVisitorStatus(log._id, "Checked-Out")}
                    disabled={log.status !== "Checked-In"}
                  >
                    Check-Out
                  </button>
                  <button
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => updateVisitorStatus(log._id, "Cancelled")}
                    disabled={log.status !== "Expected"}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OwnerVisitorAmenities;
