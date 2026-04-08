import React, { useEffect, useState } from "react";
import { Plus, Pencil, UserX, Users } from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const TenantsLeases = () => {
  const [leases, setLeases] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [saving, setSaving] = useState(false);

  const [assignForm, setAssignForm] = useState({
    propertyId: "",
    tenantId: "",
    leaseStartDate: "",
    leaseEndDate: "",
    rentAmount: "",
    securityDeposit: "",
    rentDueDay: "1",
  });

  const [editForm, setEditForm] = useState({});

  const fetchAll = async () => {
    try {
      const [leasesRes, tenantsRes, propsRes] = await Promise.all([
        api.get("/owner/leases"),
        api.get("/owner/tenant-users"),
        api.get("/owner/properties"),
      ]);
      setLeases(leasesRes.data.leases);
      setTenantUsers(tenantsRes.data.tenants);
      setProperties(propsRes.data.properties);
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/leases", assignForm);
      toast.success("Tenant assigned successfully.");
      setAssignModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign tenant.");
    } finally {
      setSaving(false);
    }
  };

  const openEditLease = (lease) => {
    setEditingLease(lease._id);
    setEditForm({
      leaseStartDate: lease.leaseStartDate?.slice(0, 10) || "",
      leaseEndDate: lease.leaseEndDate?.slice(0, 10) || "",
      rentAmount: lease.rentAmount,
      securityDeposit: lease.securityDeposit,
      rentDueDay: lease.rentDueDay,
    });
    setEditModal(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/owner/leases/${editingLease}`, editForm);
      toast.success("Lease updated.");
      setEditModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const terminateLease = async (id) => {
    if (!window.confirm("Terminate this lease? Property will be marked as Vacant.")) return;
    try {
      await api.patch(`/owner/leases/${id}/terminate`);
      toast.success("Lease terminated.");
      fetchAll();
    } catch {
      toast.error("Failed to terminate lease.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Tenants & Leases"
        subtitle="Manage tenant assignments and lease details"
        action={
          <button onClick={() => setAssignModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Assign Tenant
          </button>
        }
      />

      {leases.length === 0 ? (
        <EmptyState message="No active leases. Assign a tenant to get started." icon={Users} />
      ) : (
        <div className="space-y-4">
          {leases.map((l) => (
            <div key={l._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{l.tenant?.name}</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className="text-sm text-gray-500">{l.tenant?.email} • {l.tenant?.phone}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Property:</span>{" "}
                    {l.property?.propertyType} — {l.property?.address?.street}, {l.property?.address?.city}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 pt-1">
                    <span><span className="font-medium">Rent:</span> ₹{l.rentAmount?.toLocaleString()}/mo</span>
                    <span><span className="font-medium">Deposit:</span> ₹{l.securityDeposit?.toLocaleString()}</span>
                    <span><span className="font-medium">Due Day:</span> {l.rentDueDay}</span>
                    <span><span className="font-medium">From:</span> {new Date(l.leaseStartDate).toLocaleDateString()}</span>
                    <span><span className="font-medium">To:</span> {new Date(l.leaseEndDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button onClick={() => openEditLease(l)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => terminateLease(l._id)} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <UserX size={14} /> Terminate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Tenant Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Tenant to Property">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select value={assignForm.propertyId} onChange={(e) => setAssignForm({ ...assignForm, propertyId: e.target.value })} required className="input-field">
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyType} — {p.address.street}, {p.address.city} ({p.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select value={assignForm.tenantId} onChange={(e) => setAssignForm({ ...assignForm, tenantId: e.target.value })} required className="input-field">
              <option value="">Select tenant</option>
              {tenantUsers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
              <input type="date" value={assignForm.leaseStartDate} onChange={(e) => setAssignForm({ ...assignForm, leaseStartDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={assignForm.leaseEndDate} onChange={(e) => setAssignForm({ ...assignForm, leaseEndDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹)</label>
              <input type="number" value={assignForm.rentAmount} onChange={(e) => setAssignForm({ ...assignForm, rentAmount: e.target.value })} required min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
              <input type="number" value={assignForm.securityDeposit} onChange={(e) => setAssignForm({ ...assignForm, securityDeposit: e.target.value })} min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
              <input type="number" value={assignForm.rentDueDay} onChange={(e) => setAssignForm({ ...assignForm, rentDueDay: e.target.value })} min={1} max={31} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Assigning..." : "Assign"}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Lease Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Lease">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
              <input type="date" value={editForm.leaseStartDate} onChange={(e) => setEditForm({ ...editForm, leaseStartDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={editForm.leaseEndDate} onChange={(e) => setEditForm({ ...editForm, leaseEndDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹)</label>
              <input type="number" value={editForm.rentAmount} onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })} required min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹)</label>
              <input type="number" value={editForm.securityDeposit} onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })} min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
              <input type="number" value={editForm.rentDueDay} onChange={(e) => setEditForm({ ...editForm, rentDueDay: e.target.value })} min={1} max={31} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TenantsLeases;
