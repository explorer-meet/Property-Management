import React, { useEffect, useMemo, useState } from "react";
import { DoorOpen, RotateCcw } from "lucide-react";
import { EmptyState, Modal, PageHeader, StatusBadge } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function TenantMoveOutRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [activeRefundRequest, setActiveRefundRequest] = useState(null);
  const [submittingRefundAction, setSubmittingRefundAction] = useState(false);
  const [refundForm, setRefundForm] = useState({ acknowledged: true, note: "" });

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/tenant/move-out");
      setRequests(data?.requests || []);
    } catch {
      toast.error("Failed to load move-out requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      ackPending: requests.filter((r) => r.status === "Acknowledgement Pending").length,
      cancelled: requests.filter((r) => r.status === "Cancelled").length,
      completed: requests.filter((r) => r.status === "Completed").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (activeFilter === "All") return requests;
    return requests.filter((request) => request.status === activeFilter);
  }, [requests, activeFilter]);

  const canRaiseAgain = useMemo(() => {
    if (requests.length === 0) return true;
    const latest = requests[0];
    return ["Cancelled", "Rejected"].includes(latest.status);
  }, [requests]);

  const cancelRequest = async (id) => {
    if (!id) return;
    try {
      setCancellingId(id);
      await api.patch(`/tenant/move-out/${id}/cancel`, {
        reason: "Request cancelled by tenant to continue lease.",
      });
      toast.success("Move-out request cancelled. Lease will continue.");
      await fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel request.");
    } finally {
      setCancellingId(null);
    }
  };

  const openRefundModal = (request, acknowledged) => {
    setActiveRefundRequest(request);
    setRefundForm({ acknowledged, note: "" });
    setRefundModalOpen(true);
  };

  const submitRefundAcknowledgement = async (e) => {
    e.preventDefault();
    if (!activeRefundRequest?._id) return;

    if (!refundForm.acknowledged && !refundForm.note.trim()) {
      toast.error("Please provide dispute details.");
      return;
    }

    try {
      setSubmittingRefundAction(true);
      await api.patch(`/tenant/move-out/${activeRefundRequest._id}/refund/acknowledge`, {
        acknowledged: refundForm.acknowledged,
        note: refundForm.note,
      });
      toast.success(refundForm.acknowledged ? "Refund acknowledged." : "Refund dispute submitted.");
      setRefundModalOpen(false);
      setActiveRefundRequest(null);
      await fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit refund response.");
    } finally {
      setSubmittingRefundAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Move-Out Requests"
        subtitle="Track every move-out request and manage cancellations from one place."
        action={
          canRaiseAgain ? (
            <button
              type="button"
              onClick={() => navigate("/tenant/leases")}
              className="btn-primary inline-flex items-center gap-1.5"
            >
              <DoorOpen size={14} /> Request Move-Out
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "All", label: "Total", value: summary.total, base: "border-slate-200 bg-white text-slate-700", active: "ring-2 ring-slate-300" },
          { key: "Pending", label: "Pending", value: summary.pending, base: "border-amber-200 bg-amber-50 text-amber-700", active: "ring-2 ring-amber-300" },
          { key: "Approved", label: "Approved", value: summary.approved, base: "border-emerald-200 bg-emerald-50 text-emerald-700", active: "ring-2 ring-emerald-300" },
          { key: "Acknowledgement Pending", label: "Ack Pending", value: summary.ackPending, base: "border-yellow-200 bg-yellow-50 text-yellow-700", active: "ring-2 ring-yellow-300" },
          { key: "Cancelled", label: "Cancelled", value: summary.cancelled, base: "border-gray-200 bg-gray-50 text-gray-700", active: "ring-2 ring-gray-300" },
          { key: "Completed", label: "Completed", value: summary.completed, base: "border-blue-200 bg-blue-50 text-blue-700", active: "ring-2 ring-blue-300" },
        ].map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => setActiveFilter(tile.key)}
            className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm ${tile.base} ${activeFilter === tile.key ? tile.active : ""}`}
          >
            <p className="text-[11px] uppercase tracking-wider">{tile.label}</p>
            <p className="text-2xl font-extrabold mt-1">{tile.value}</p>
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title={activeFilter === "All" ? "No move-out requests" : `No ${activeFilter.toLowerCase()} requests`}
          subtitle={activeFilter === "All"
            ? "When you raise a request, it will appear here for tracking."
            : "Choose another tile above to view other request states."}
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const canCancel = ["Pending", "Approved"].includes(request.status);
            return (
              <div key={request._id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-gray-500">Requested on {formatDate(request.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Requested move-out date: <span className="font-semibold text-gray-900">{formatDate(request.requestedMoveOutDate)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Property: {request.property?.propertyType || "Property"}
                      {[
                        request.property?.address?.street,
                        request.property?.address?.city,
                        request.property?.address?.state,
                        request.property?.address?.pincode,
                      ].filter(Boolean).length
                        ? ` - ${[
                          request.property?.address?.street,
                          request.property?.address?.city,
                          request.property?.address?.state,
                          request.property?.address?.pincode,
                        ].filter(Boolean).join(", ")}`
                        : ""}
                    </p>
                    {request.reason ? <p className="text-sm text-gray-600">Reason: {request.reason}</p> : null}
                    {request.status === "Approved" && request.approvedLastStayingDate ? (
                      <p className="text-sm text-emerald-700">Approved last staying date: {formatDate(request.approvedLastStayingDate)}</p>
                    ) : null}
                    {request.status === "Rejected" && request.ownerNote ? (
                      <p className="text-sm text-red-600">Owner note: {request.ownerNote}</p>
                    ) : null}

                    {["Acknowledgement Pending", "Completed"].includes(request.status) ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 space-y-1">
                        {request.status === "Acknowledgement Pending" ? (
                          <p className="font-semibold text-amber-700">Acknowledgement pending. Please confirm payout once received.</p>
                        ) : null}
                        <p>Refund status: {request.refund?.status || "NotInitiated"}</p>
                        {request.refund?.payoutDate ? <p>Payout date: {formatDate(request.refund.payoutDate)}</p> : null}
                        {request.refund?.payoutReference ? <p>Payout reference: {request.refund.payoutReference}</p> : null}
                        {request.refund?.payoutProof ? <p className="break-all">Payout proof: {request.refund.payoutProof}</p> : null}
                        {request.refund?.ownerNote ? <p>Owner note: {request.refund.ownerNote}</p> : null}
                        {request.refund?.dispute?.status === "Open" ? (
                          <p className="text-red-700">Dispute open: {request.refund?.dispute?.tenantMessage || "Waiting for owner response."}</p>
                        ) : null}
                        {request.refund?.dispute?.status === "Resolved" ? (
                          <p className="text-emerald-700">Dispute resolved: {request.refund?.dispute?.ownerResolutionNote || "Owner shared resolution."}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => cancelRequest(request._id)}
                        disabled={cancellingId === request._id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={13} /> {cancellingId === request._id ? "Cancelling..." : "Cancel Request"}
                      </button>
                    ) : null}

                    {(request.status === "Acknowledgement Pending" || (request.status === "Completed" && request.refund?.status === "Paid")) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openRefundModal(request, true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Acknowledge Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => openRefundModal(request, false)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Raise Dispute
                        </button>
                      </>
                    ) : null}

                    {["Cancelled", "Rejected"].includes(request.status) ? (
                      <button
                        type="button"
                        onClick={() => navigate("/tenant/leases")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <DoorOpen size={13} /> Raise Again
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title={refundForm.acknowledged ? "Acknowledge Refund" : "Raise Refund Dispute"}
      >
        <form onSubmit={submitRefundAcknowledgement} className="space-y-4">
          <div className={`rounded-lg border px-3 py-2 text-sm ${refundForm.acknowledged ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {refundForm.acknowledged
              ? "Confirm that you have received the security deposit payout."
              : "Explain the mismatch or issue in payout so owner can resolve it."}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              rows={4}
              value={refundForm.note}
              onChange={(e) => setRefundForm((prev) => ({ ...prev, note: e.target.value }))}
              className="input-field"
              placeholder={refundForm.acknowledged ? "Optional acknowledgement note" : "Required: describe your dispute"}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRefundModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submittingRefundAction} className="btn-primary">
              {submittingRefundAction ? "Submitting..." : refundForm.acknowledged ? "Confirm Acknowledgement" : "Submit Dispute"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
