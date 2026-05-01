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
  // Amenity icons - Residential
  Waves,
  Dumbbell,
  Baby,
  Flower2,
  Car,
  ShieldCheck,
  Video,
  BatteryCharging,
  ArrowUpDown,
  PersonStanding,
  Gamepad2,
  PhoneCall,
  Wifi,
  CloudRain,
  // Amenity icons - Commercial
  Monitor,
  UserCheck,
  Coffee,
  Flame,
  Truck,
  Wind,
  Server,
  Zap,
  ConciergeBell,
  ParkingSquare,
} from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState, PropertyImageCarousel } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

// ─── Amenity Definitions ────────────────────────────────────────────────────
const RESIDENTIAL_AMENITIES = [
  { key: "swimmingPool",        label: "Swimming Pool",       icon: Waves,          color: "text-cyan-600",    bg: "bg-cyan-50",    ring: "ring-cyan-300"    },
  { key: "gymnasium",           label: "Gymnasium",           icon: Dumbbell,       color: "text-violet-600",  bg: "bg-violet-50",  ring: "ring-violet-300"  },
  { key: "kidsPlayArea",        label: "Kids Play Area",      icon: Baby,           color: "text-pink-600",    bg: "bg-pink-50",    ring: "ring-pink-300"    },
  { key: "garden",              label: "Garden / Gazebo",     icon: Flower2,        color: "text-green-600",   bg: "bg-green-50",   ring: "ring-green-300"   },
  { key: "coveredParking",      label: "Covered Parking",     icon: Car,            color: "text-blue-600",    bg: "bg-blue-50",    ring: "ring-blue-300"    },
  { key: "visitorParking",      label: "Visitor Parking",     icon: ParkingSquare,  color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-300"  },
  { key: "security24x7",        label: "24/7 Security",       icon: ShieldCheck,    color: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-300"   },
  { key: "cctv",                label: "CCTV Surveillance",   icon: Video,          color: "text-slate-600",   bg: "bg-slate-50",   ring: "ring-slate-300"   },
  { key: "powerBackup",         label: "Power Backup",        icon: BatteryCharging,color: "text-yellow-600",  bg: "bg-yellow-50",  ring: "ring-yellow-300"  },
  { key: "elevator",            label: "Elevator / Lift",     icon: ArrowUpDown,    color: "text-teal-600",    bg: "bg-teal-50",    ring: "ring-teal-300"    },
  { key: "clubhouse",           label: "Clubhouse",           icon: Building2,      color: "text-orange-600",  bg: "bg-orange-50",  ring: "ring-orange-300"  },
  { key: "joggingTrack",        label: "Jogging Track",       icon: PersonStanding, color: "text-lime-600",    bg: "bg-lime-50",    ring: "ring-lime-300"    },
  { key: "indoorGames",         label: "Indoor Games",        icon: Gamepad2,       color: "text-purple-600",  bg: "bg-purple-50",  ring: "ring-purple-300"  },
  { key: "intercom",            label: "Intercom",            icon: PhoneCall,      color: "text-rose-600",    bg: "bg-rose-50",    ring: "ring-rose-300"    },
  { key: "wifi",                label: "Wi-Fi Ready",         icon: Wifi,           color: "text-sky-600",     bg: "bg-sky-50",     ring: "ring-sky-300"     },
  { key: "rainwaterHarvesting", label: "Rainwater Harvesting",icon: CloudRain,      color: "text-blue-500",    bg: "bg-blue-50",    ring: "ring-blue-300"    },
];

const COMMERCIAL_AMENITIES = [
  { key: "parking",             label: "Parking",             icon: Car,            color: "text-blue-600",    bg: "bg-blue-50",    ring: "ring-blue-300"    },
  { key: "conferenceRoom",      label: "Conference Room",     icon: Monitor,        color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-300"  },
  { key: "reception",           label: "Reception / Lobby",   icon: ConciergeBell,  color: "text-amber-600",   bg: "bg-amber-50",   ring: "ring-amber-300"   },
  { key: "cafeteria",           label: "Cafeteria / Pantry",  icon: Coffee,         color: "text-orange-600",  bg: "bg-orange-50",  ring: "ring-orange-300"  },
  { key: "powerBackup",         label: "Power Backup",        icon: BatteryCharging,color: "text-yellow-600",  bg: "bg-yellow-50",  ring: "ring-yellow-300"  },
  { key: "security24x7",        label: "24/7 Security",       icon: ShieldCheck,    color: "text-green-600",   bg: "bg-green-50",   ring: "ring-green-300"   },
  { key: "cctv",                label: "CCTV Surveillance",   icon: Video,          color: "text-slate-600",   bg: "bg-slate-50",   ring: "ring-slate-300"   },
  { key: "elevator",            label: "Elevator / Lift",     icon: ArrowUpDown,    color: "text-teal-600",    bg: "bg-teal-50",    ring: "ring-teal-300"    },
  { key: "highSpeedInternet",   label: "High-Speed Internet", icon: Wifi,           color: "text-sky-600",     bg: "bg-sky-50",     ring: "ring-sky-300"     },
  { key: "fireSafety",          label: "Fire Safety",         icon: Flame,          color: "text-red-600",     bg: "bg-red-50",     ring: "ring-red-300"     },
  { key: "generator",           label: "Generator",           icon: Zap,            color: "text-violet-600",  bg: "bg-violet-50",  ring: "ring-violet-300"  },
  { key: "loadingDock",         label: "Loading Dock",        icon: Truck,          color: "text-brown-600",   bg: "bg-stone-50",   ring: "ring-stone-300"   },
  { key: "airConditioning",     label: "Air Conditioning",    icon: Wind,           color: "text-cyan-600",    bg: "bg-cyan-50",    ring: "ring-cyan-300"    },
  { key: "serverRoom",          label: "Server Room",         icon: Server,         color: "text-gray-600",    bg: "bg-gray-50",    ring: "ring-gray-300"    },
  { key: "restrooms",           label: "Dedicated Restrooms", icon: UserCheck,      color: "text-pink-600",    bg: "bg-pink-50",    ring: "ring-pink-300"    },
];

const RESIDENTIAL_TYPES = ["Home", "Flat"];


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
  amenities: {},
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
      amenities: p.amenities ? (p.amenities instanceof Map ? Object.fromEntries(p.amenities) : { ...p.amenities }) : {},
    });
    setEditingId(p._id);
    setPhotoFiles([]);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["street", "city", "state", "pincode"].includes(name)) {
      setForm((f) => ({ ...f, address: { ...f.address, [name]: value } }));
    } else if (name === "propertyType") {
      // Reset amenities when property type category changes (residential ↔ commercial)
      const wasResidential = RESIDENTIAL_TYPES.includes(form.propertyType);
      const isNowResidential = RESIDENTIAL_TYPES.includes(value);
      setForm((f) => ({ ...f, propertyType: value, amenities: wasResidential !== isNowResidential ? {} : f.amenities }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const toggleAmenity = (key) => {
    setForm((f) => ({ ...f, amenities: { ...f.amenities, [key]: !f.amenities[key] } }));
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
                  {/* Amenities summary */}
                  {(() => {
                    const amenMap = p.amenities instanceof Map ? Object.fromEntries(p.amenities) : (p.amenities || {});
                    const amenList = RESIDENTIAL_TYPES.includes(p.propertyType) ? RESIDENTIAL_AMENITIES : COMMERCIAL_AMENITIES;
                    const enabled = amenList.filter((a) => amenMap[a.key]);
                    if (enabled.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-1.5 font-medium">Amenities ({enabled.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {enabled.slice(0, 6).map(({ key, label, icon: AIcon, color, bg }) => (
                            <span key={key} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${bg} ${color} px-2 py-0.5 rounded-full`}>
                              <AIcon size={10} /> {label}
                            </span>
                          ))}
                          {enabled.length > 6 && (
                            <span className="inline-flex items-center text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              +{enabled.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Property" : "Add New Property"} size="3xl">
        <form onSubmit={handleSave}>

          {/* Dynamic header banner */}
          <div className={`-mx-6 -mt-5 px-8 py-6 bg-gradient-to-r ${selectedTypeMeta.grad} flex items-center gap-5`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center ring-2 ring-white/30 shrink-0">
              <SelectedTypeIcon size={32} className="text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                {editingId ? "Editing" : "New"} Property
              </p>
              <p className="text-white font-extrabold text-2xl leading-tight">{form.propertyType}</p>
              {form.address.city && (
                <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin size={13} /> {form.address.city}{form.address.state ? `, ${form.address.state}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-5">

              {/* Property Type */}
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
                        onClick={() => handleChange({ target: { name: "propertyType", value: label } })}
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

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Location Details</label>
                <div className="space-y-3">
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all">
                    <span className="px-3 text-gray-400 shrink-0"><Navigation size={15} /></span>
                    <input type="text" name="street" value={form.address.street} onChange={handleChange} required
                      placeholder="Street Address"
                      className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all">
                      <span className="px-3 text-gray-400 shrink-0"><MapPin size={15} /></span>
                      <input type="text" name="city" value={form.address.city} onChange={handleChange} required
                        placeholder="City"
                        className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400" />
                    </div>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all">
                      <span className="px-3 text-gray-400 shrink-0"><MapPin size={15} /></span>
                      <input type="text" name="state" value={form.address.state} onChange={handleChange} required
                        placeholder="State"
                        className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400" />
                    </div>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all">
                      <span className="px-3 text-gray-400 shrink-0"><Hash size={15} /></span>
                      <input type="text" name="pincode" value={form.address.pincode} onChange={handleChange}
                        placeholder="Pincode" inputMode="numeric"
                        className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400" />
                    </div>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-400 transition-all">
                      <span className="px-3 text-gray-400 shrink-0"><DoorOpen size={15} /></span>
                      <input type="number" name="numberOfRooms" value={form.numberOfRooms} onChange={handleChange} min={1}
                        placeholder="Rooms / Units"
                        className="w-full rounded-r-xl px-3.5 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  <span className="flex items-center gap-1.5"><FileText size={13} /> Description <span className="normal-case font-normal text-gray-400">(optional)</span></span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={4} placeholder="Describe the property — highlights, rules…"
                  className="input-field resize-none w-full" />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Property Photos (optional)</label>
                <label className="flex items-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 px-4 py-3 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700">
                      {photoFiles.length > 0 ? `${photoFiles.length} file(s) selected` : "Click to upload photos"}
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP — uploaded on save</p>
                  </div>
                  <input type="file" multiple accept="image/*"
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                    className="sr-only" />
                </label>
              </div>
            </div>

            {/* ── RIGHT COLUMN — Amenities ── */}
            {(() => {
              const isResidential = RESIDENTIAL_TYPES.includes(form.propertyType);
              const amenityList = isResidential ? RESIDENTIAL_AMENITIES : COMMERCIAL_AMENITIES;
              const enabledCount = amenityList.filter((a) => form.amenities[a.key]).length;
              return (
                <div className="flex flex-col lg:border-l lg:border-gray-100 lg:pl-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Amenities</label>
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                      {enabledCount} / {amenityList.length} on
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    Toggle available amenities for this {isResidential ? "residential" : "commercial"} property.
                  </p>
                  <div className="flex-1 overflow-y-auto max-h-[440px] pr-0.5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {amenityList.map(({ key, label, icon: AmenityIcon, color, bg }) => {
                        const active = Boolean(form.amenities[key]);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleAmenity(key)}
                            className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-colors duration-150 cursor-pointer select-none w-full
                              ${active
                                ? `${bg} border-current ${color} shadow-sm`
                                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {active && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={10} className="text-white" />
                              </span>
                            )}
                            <AmenityIcon size={20} className={active ? color : "text-gray-400"} />
                            <span className={`text-[10px] font-semibold leading-tight ${active ? "text-gray-800" : "text-gray-500"}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-6">Cancel</button>
            <button type="submit" disabled={saving} className={`btn-primary px-7 flex items-center gap-2 bg-gradient-to-r ${selectedTypeMeta.grad} shadow-lg`}>
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
