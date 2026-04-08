import React, { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const CATEGORIES = ["Electric", "Plumbing", "General", "Carpentry", "Painting", "Other"];

const TenantMaintenance = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ category: "General", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/tenant/maintenance");
      setRequests(data.requests);
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tenant/maintenance", form);
      toast.success("Request submitted successfully.");
      setAddModal(false);
      setForm({ category: "General", description: "" });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Maintenance Requests"
        subtitle="Raise and track your maintenance requests"
        action={
          <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Request
          </button>
        }
      />

      {requests.length === 0 ? (
        <EmptyState message="No maintenance requests yet." icon={Wrench} />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{r.category}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-gray-600">{r.description}</p>
                  <p className="text-xs text-gray-400">
                    Filed on {new Date(r.createdAt).toLocaleDateString()} •{" "}
                    {r.property?.propertyType}, {r.property?.address?.city}
                  </p>
                  {r.comments?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Updates from Owner</p>
                      {r.comments.map((c, i) => (
                        <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                          <span className="font-medium text-blue-600">{c.addedBy?.name || "Owner"}: </span>
                          {c.text}
                          <span className="text-xs text-gray-400 ml-2">{new Date(c.addedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="input-field"
              placeholder="Describe the issue in detail..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Submitting..." : "Submit"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenantMaintenance;
