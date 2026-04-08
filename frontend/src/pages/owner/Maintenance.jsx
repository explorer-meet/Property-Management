import React, { useEffect, useState } from "react";
import { Wrench, MessageSquare } from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [commentModal, setCommentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      const filter = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : "";
      const { data } = await api.get(`/owner/maintenance${filter}`);
      setRequests(data.requests);
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const openCommentModal = (req) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setComment("");
    setCommentModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/owner/maintenance/${selectedRequest._id}/status`, {
        status: newStatus,
        comment: comment || undefined,
      });
      toast.success("Request updated.");
      setCommentModal(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Maintenance Requests"
        subtitle="View and manage tenant maintenance requests"
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "Open", "In Progress", "Resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filterStatus === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState message="No maintenance requests." icon={Wrench} />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{r.category}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-gray-600">{r.description}</p>
                  <div className="flex flex-wrap gap-x-4 text-xs text-gray-400 pt-1">
                    <span>Tenant: {r.tenant?.name} ({r.tenant?.email})</span>
                    <span>Property: {r.property?.propertyType}, {r.property?.address?.city}</span>
                    <span>Filed: {new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comments?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Comments</p>
                      {r.comments.map((c, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                          <span className="font-medium text-gray-600">{c.addedBy?.name || "User"}: </span>
                          {c.text}
                          <span className="text-xs text-gray-400 ml-2">{new Date(c.addedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openCommentModal(r)}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3 whitespace-nowrap"
                >
                  <MessageSquare size={14} /> Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={commentModal} onClose={() => setCommentModal(false)} title="Update Request">
        {selectedRequest && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Comment (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Write a comment or update..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setCommentModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Update"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Maintenance;
