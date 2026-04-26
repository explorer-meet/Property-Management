import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Home,
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  DoorOpen,
  Filter,
  Store,
  Briefcase,
  FileText,
  Hash,
  Navigation,
  LayoutDashboard,
} from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState, PropertyImageCarousel } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { resolvePropertyCoverImage } from "../../utils/propertyImages";

const PROPERTY_TYPES = [
  { label: "Home",   icon: Home,      color: "blue",   grad: "from-blue-500 to-indigo-600"   },
  { label: "Flat",   icon: Building2, color: "violet", grad: "from-violet-500 to-purple-600" },
  { label: "Office", icon: Briefcase, color: "amber",  grad: "from-amber-500 to-orange-500"  },
  { label: "Shop",   icon: Store,     color: "emerald",grad: "from-emerald-500 to-teal-600"  },
];

const TYPE_COLORS = {
  Home:   { ring: "ring-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   grad: "from-blue-500 to-indigo-600"   },
  Flat:   { ring: "ring-violet-400", bg: "bg-violet-50", text: "text-violet-700", grad: "from-violet-500 to-purple-600" },
  Office: { ring: "ring-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  grad: "from-amber-500 to-orange-500"  },
  Shop:   { ring: "ring-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700",grad: "from-emerald-500 to-teal-600"  },
};

const emptyForm = {
  propertyType: "Home",
  address: { street: "", city: "", state: "", pincode: "" },
  description: "",
  numberOfRooms: 1,
};

const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [photoFiles, setPhotoFiles] = useState([]);

  const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

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

  const openAdd = () => { setForm(emptyForm); setPhotoFiles([]); setEditingId(null); setModalOpen(true); };

  const openEdit = (p) => {
    setForm({
      propertyType: p.propertyType,
      address: { ...p.address },
      description: p.description || "",
      numberOfRooms: p.numberOfRooms,
    });
    setEditingId(p._id);
    setPhotoFiles([]);
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
        if (photoFiles.length > 0) {
          const photoData = new FormData();
          photoFiles.forEach((file) => photoData.append("photos", file));
          await api.post(`/owner/properties/${editingId}/photos`, photoData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        toast.success("Property updated.");
      } else {
        const { data } = await api.post("/owner/properties", form);
        const createdPropertyId = data?.property?._id;
        if (createdPropertyId && photoFiles.length > 0) {
          const photoData = new FormData();
          photoFiles.forEach((file) => photoData.append("photos", file));
          await api.post(`/owner/properties/${createdPropertyId}/photos`, photoData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        toast.success("Property added.");
      }
      setModalOpen(false);
      setPhotoFiles([]);
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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    const addressText = `${p.address?.street || ""} ${p.address?.city || ""} ${p.address?.state || ""} ${p.address?.pincode || ""}`.toLowerCase();
    const matchesSearch = !normalizedSearch || p.propertyType.toLowerCase().includes(normalizedSearch) || addressText.includes(normalizedSearch);
    const matchesType = typeFilter === "All" || p.propertyType === typeFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const total = properties.length;
  const occupied = properties.filter((p) => p.status === "Occupied").length;
  const vacant = properties.filter((p) => p.status === "Vacant").length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  // Selected type meta for modal header
  const selectedTypeMeta = PROPERTY_TYPES.find((t) => t.label === form.propertyType) || PROPERTY_TYPES[0];
  const SelectedTypeIcon = selectedTypeMeta.icon;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        subtitle="Manage and monitor your portfolio with smart controls"
        action={
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-5 py-2.5">
            <Plus size={17} /> Add Property
          </button>
        }
      />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-900 px-6 py-7 sm:px-8 shadow-xl">
        <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200 font-semibold">Portfolio Intelligence</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold">Your real estate inventory, beautifully organized</h2>
            <p className="mt-2 text-sm text-blue-100 max-w-xl">
              Track occupancy and unit capacity instantly, then drill down into each property with clear actions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Occupancy</p>
            <p className="mt-2 text-3xl font-extrabold">{occupancyRate}%</p>
            <p className="mt-1 text-xs text-emerald-300 flex items-center gap-1">
              <CheckCircle2 size={14} /> {occupied} occupied, {vacant} vacant
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { label: "Total Properties", value: total,    sub: "Across all types", color: "text-gray-900", filter: "All" },
          { label: "Occupied",         value: occupied, sub: "Currently active", color: "text-blue-700", filter: "Occupied" },
          { label: "Vacant",           value: vacant,   sub: "Ready to lease",   color: "text-gray-800", filter: "Vacant" },
        ].map(({ label, value, sub, color, filter }) => {
          const isActive = statusFilter === filter;
          return (
          <button
            key={label}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
              isActive ? "border-indigo-300 ring-2 ring-indigo-200" : "border-gray-100"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </button>
        );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
            <div className="h-full px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-400 flex items-center">
              <Search size={16} />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by type or address…"
              className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white outline-none"
            />
          </div>
          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
            <div className="h-full px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-400 flex items-center">
              <Filter size={16} />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white outline-none cursor-pointer"
            >
              <option value="All">All Property Types</option>
              {PROPERTY_TYPES.map(({ label }) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <EmptyState message="No properties yet. Add your first property." icon={Home} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProperties.map((p) => {
            const meta = PROPERTY_TYPES.find((t) => t.label === p.propertyType) || PROPERTY_TYPES[0];
            const TypeIcon = meta.icon;
            const tc = TYPE_COLORS[p.propertyType] || TYPE_COLORS.Home;
            return (
              <div key={p._id} className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {/* Coloured top stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${meta.grad}`} />
                <PropertyImageCarousel
                  photoUrls={p.photoUrls || []}
                  propertyType={p.propertyType}
                  apiOrigin={apiOrigin}
                  height="h-44"
                />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`inline-flex items-center gap-2 rounded-xl ${tc.bg} ${tc.text} px-3 py-1.5 text-xs font-bold ring-1 ${tc.ring}/40`}>
                      <TypeIcon size={14} /> {p.propertyType}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-gray-700 flex items-start gap-1.5 mb-3">
                    <MapPin size={14} className="mt-0.5 text-gray-400 shrink-0" />
                    <span>{p.address.street}, {p.address.city}, {p.address.state}{p.address.pincode ? ` - ${p.address.pincode}` : ""}</span>
                  </p>
                  {p.description
                    ? <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{p.description}</p>
                    : <p className="text-sm text-gray-400 mb-4 italic min-h-[40px]">No description added.</p>
                  }
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 mb-4">
                    <span className="text-xs text-gray-500">Capacity</span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <DoorOpen size={14} className="text-gray-400" />
                      {p.numberOfRooms} room{p.numberOfRooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/owner/properties/${p._id}/manage`)}
                      className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3 flex-1 justify-center"
                    >
                      <LayoutDashboard size={14} /> Manage
                    </button>
                    <button onClick={() => openEdit(p)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3 flex-1 justify-center">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3 flex-1 justify-center">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Property" : "Add New Property"}>
        <form onSubmit={handleSave} className="space-y-5">

          {/* Dynamic header banner */}
          <div className={`-mx-6 -mt-5 px-6 py-5 bg-gradient-to-r ${selectedTypeMeta.grad} flex items-center gap-4`}>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center ring-2 ring-white/30 shrink-0">
              <SelectedTypeIcon size={28} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                {editingId ? "Editing" : "New"} Property
              </p>
              <p className="text-white font-extrabold text-xl leading-tight">{form.propertyType}</p>
              {form.address.city && (
                <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin size={11} /> {form.address.city}{form.address.state ? `, ${form.address.state}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Property Type — icon card selector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Property Type</label>
            <div className="grid grid-cols-4 gap-2">
              {PROPERTY_TYPES.map(({ label, icon: TypeIcon, grad }) => {
                const selected = form.propertyType === label;
                const tc = TYPE_COLORS[label];
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, propertyType: label }))}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-3.5 px-2 transition-all duration-200 cursor-pointer
                      ${selected
                        ? `border-transparent bg-gradient-to-br ${grad} shadow-lg scale-105`
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <TypeIcon size={22} className={selected ? "text-white" : tc.text} />
                    <span className={`text-xs font-bold ${selected ? "text-white" : "text-gray-600"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address section */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Location Details</label>
            <div className="space-y-3">
              <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all duration-200">
                <span className="px-3 text-gray-400 shrink-0">
                  <Navigation size={15} />
                </span>
                <input
                  type="text"
                  name="street"
                  value={form.address.street}
                  onChange={handleChange}
                  required
                  placeholder="Street Address"
                  className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all duration-200">
                  <span className="px-3 text-gray-400 shrink-0">
                    <MapPin size={15} />
                  </span>
                  <input
                    type="text"
                    name="city"
                    value={form.address.city}
                    onChange={handleChange}
                    required
                    placeholder="City"
                    className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all duration-200">
                  <span className="px-3 text-gray-400 shrink-0">
                    <MapPin size={15} />
                  </span>
                  <input
                    type="text"
                    name="state"
                    value={form.address.state}
                    onChange={handleChange}
                    required
                    placeholder="State"
                    className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all duration-200">
                  <span className="px-3 text-gray-400 shrink-0">
                    <Hash size={15} />
                  </span>
                  <input
                    type="text"
                    name="pincode"
                    value={form.address.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    inputMode="numeric"
                    className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all duration-200">
                  <span className="px-3 text-gray-400 shrink-0">
                    <DoorOpen size={15} />
                  </span>
                  <input
                    type="number"
                    name="numberOfRooms"
                    value={form.numberOfRooms}
                    onChange={handleChange}
                    min={1}
                    placeholder="Rooms / Units"
                    className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              <span className="flex items-center gap-1.5"><FileText size={13} /> Description <span className="normal-case font-normal text-gray-400">(optional)</span></span>
            </label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Describe the property — amenities, highlights, rules…"
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Property Photos (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">{photoFiles.length} file(s) selected. Images upload when you save property.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-5">Cancel</button>
            <button type="submit" disabled={saving} className={`btn-primary px-6 flex items-center gap-2 bg-gradient-to-r ${selectedTypeMeta.grad} shadow-lg`}>
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving…
                </>
              ) : (
                <><Plus size={16} /> {editingId ? "Update Property" : "Add Property"}</>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;
