import React, { useEffect, useState } from "react";
import { Plus, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const RentManagement = () => {
  const [rents, setRents] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    leaseId: "",
    month: MONTHS[new Date().getMonth()],
    year: String(currentYear),
    dueDate: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const filter = filterStatus ? `?status=${filterStatus}` : "";
      const [rentsRes, leasesRes] = await Promise.all([
        api.get(`/owner/rent${filter}`),
        api.get("/owner/leases"),
      ]);
      setRents(rentsRes.data.rents);
      setLeases(leasesRes.data.leases);
    } catch {
      toast.error("Failed to load rent data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/owner/rent", form);
      toast.success("Rent record created.");
      setAddModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create rent record.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.patch(`/owner/rent/${id}/paid`, { paidDate: new Date().toISOString() });
      toast.success("Marked as paid.");
      fetchData();
    } catch {
      toast.error("Failed to mark as paid.");
    }
  };

  const markOverdue = async () => {
    try {
      const { data } = await api.post("/owner/rent/mark-overdue");
      toast.success(data.message);
      fetchData();
    } catch {
      toast.error("Failed to mark overdue records.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Rent Management"
        subtitle="Track and manage rent payments"
        action={
          <div className="flex gap-2">
            <button onClick={markOverdue} className="btn-secondary flex items-center gap-1.5 text-sm">
              <AlertCircle size={15} /> Mark Overdue
            </button>
            <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Generate Rent
            </button>
          </div>
        }
      />

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["", "Pending", "Paid", "Overdue"].map((s) => (
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

      {rents.length === 0 ? (
        <EmptyState message="No rent records found." icon={DollarSign} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="px-4 py-3 font-medium text-gray-600">Property</th>
                <th className="px-4 py-3 font-medium text-gray-600">Month / Year</th>
                <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rents.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.tenant?.name}</p>
                    <p className="text-gray-400 text-xs">{r.tenant?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.property?.propertyType} — {r.property?.address?.city}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.month} {r.year}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{r.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status !== "Paid" && (
                      <button onClick={() => markPaid(r._id)} className="flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium">
                        <CheckCircle size={14} /> Mark Paid
                      </button>
                    )}
                    {r.status === "Paid" && r.paidDate && (
                      <span className="text-xs text-gray-400">
                        Paid {new Date(r.paidDate).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Generate Rent Record">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease</label>
            <select value={form.leaseId} onChange={(e) => setForm({ ...form, leaseId: e.target.value })} required className="input-field">
              <option value="">Select lease</option>
              {leases.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.tenant?.name} — {l.property?.propertyType}, {l.property?.address?.city} (₹{l.rentAmount}/mo)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="input-field">
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="input-field">
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Any notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Generating..." : "Generate"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RentManagement;
