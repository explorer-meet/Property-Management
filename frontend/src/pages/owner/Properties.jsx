import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Home } from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const PROPERTY_TYPES = ["Home", "Flat", "Office", "Shop"];

const emptyForm = {
  propertyType: "Home",
  address: { street: "", city: "", state: "", pincode: "" },
  description: "",
  numberOfRooms: 1,
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get("/owner/properties");
      setProperties(data.properties);
    } catch {
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };

  const openEdit = (p) => {
    setForm({
      propertyType: p.propertyType,
      address: { ...p.address },
      description: p.description || "",
      numberOfRooms: p.numberOfRooms,
    });
    setEditingId(p._id);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["street", "city", "state", "pincode"].includes(name)) {
      setForm((f) => ({ ...f, address: { ...f.address, [name]: value } }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/owner/properties/${editingId}`, form);
        toast.success("Property updated.");
      } else {
        await api.post("/owner/properties", form);
        toast.success("Property added.");
      }
      setModalOpen(false);
      fetchProperties();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try {
      await api.delete(`/owner/properties/${id}`);
      toast.success("Property deleted.");
      fetchProperties();
    } catch {
      toast.error("Delete failed.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="Manage all your properties"
        action={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Property
          </button>
        }
      />

      {properties.length === 0 ? (
        <EmptyState message="No properties yet. Add your first property." icon={Home} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.propertyType}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {p.address.street}, {p.address.city}, {p.address.state}
                    {p.address.pincode ? ` - ${p.address.pincode}` : ""}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.description}</p>}
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-medium">{p.numberOfRooms}</span> room{p.numberOfRooms !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(p)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(p._id)} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Property" : "Add Property"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
            <select name="propertyType" value={form.propertyType} onChange={handleChange} className="input-field">
              {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input type="text" name="street" value={form.address.street} onChange={handleChange} required className="input-field" placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" name="city" value={form.address.city} onChange={handleChange} required className="input-field" placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" name="state" value={form.address.state} onChange={handleChange} required className="input-field" placeholder="Maharashtra" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input type="text" name="pincode" value={form.address.pincode} onChange={handleChange} className="input-field" placeholder="400001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rooms / Units</label>
              <input type="number" name="numberOfRooms" value={form.numberOfRooms} onChange={handleChange} min={1} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field" placeholder="Optional description..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;
