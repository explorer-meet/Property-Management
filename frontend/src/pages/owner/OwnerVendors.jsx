import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "../../components/UI";
import {
  BriefcaseBusiness, Search, MapPin, Phone, Mail, Wrench, LayoutGrid, Zap,
  Droplets, Hammer, Paintbrush, Star, FileText, Receipt, ChevronDown,
  ChevronUp, Plus, Trash2, Save, X, IndianRupee, CheckCircle2, Tag,
} from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const CATEGORY_META = [
  { key: "All", icon: LayoutGrid },
  { key: "Electric", icon: Zap },
  { key: "Plumbing", icon: Droplets },
  { key: "General", icon: Wrench },
  { key: "Carpentry", icon: Hammer },
  { key: "Painting", icon: Paintbrush },
  { key: "Other", icon: BriefcaseBusiness },
];

const SPEC_OPTIONS = ["Electric", "Plumbing", "General", "Carpentry", "Painting", "Other"];

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        className={`${s <= Math.round(value || 0) ? "text-amber-400 fill-amber-400" : "text-gray-300"} ${!readonly ? "cursor-pointer hover:text-amber-400" : ""}`}
        onClick={() => !readonly && onChange && onChange(s)}
      />
    ))}
  </div>
);

const formatCurrency = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const getVendorTheme = (specialization) => {
  const themeMap = {
    Electric: {
      card: "border-amber-200",
      glow: "from-amber-500 via-orange-500 to-yellow-400",
      chip: "bg-amber-50 text-amber-700 border-amber-200",
      panel: "from-amber-50 to-orange-50 border-amber-100",
      icon: "bg-amber-100 text-amber-700",
      text: "text-amber-700",
    },
    Plumbing: {
      card: "border-cyan-200",
      glow: "from-cyan-500 via-sky-500 to-blue-500",
      chip: "bg-cyan-50 text-cyan-700 border-cyan-200",
      panel: "from-cyan-50 to-blue-50 border-cyan-100",
      icon: "bg-cyan-100 text-cyan-700",
      text: "text-cyan-700",
    },
    Carpentry: {
      card: "border-orange-200",
      glow: "from-orange-500 via-amber-500 to-yellow-500",
      chip: "bg-orange-50 text-orange-700 border-orange-200",
      panel: "from-orange-50 to-amber-50 border-orange-100",
      icon: "bg-orange-100 text-orange-700",
      text: "text-orange-700",
    },
    Painting: {
      card: "border-pink-200",
      glow: "from-pink-500 via-rose-500 to-fuchsia-500",
      chip: "bg-pink-50 text-pink-700 border-pink-200",
      panel: "from-pink-50 to-rose-50 border-pink-100",
      icon: "bg-pink-100 text-pink-700",
      text: "text-pink-700",
    },
    General: {
      card: "border-emerald-200",
      glow: "from-emerald-500 via-teal-500 to-cyan-500",
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
      panel: "from-emerald-50 to-teal-50 border-emerald-100",
      icon: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-700",
    },
    Other: {
      card: "border-violet-200",
      glow: "from-violet-500 via-indigo-500 to-blue-500",
      chip: "bg-violet-50 text-violet-700 border-violet-200",
      panel: "from-violet-50 to-indigo-50 border-violet-100",
      icon: "bg-violet-100 text-violet-700",
      text: "text-violet-700",
    },
  };

  return themeMap[specialization] || themeMap.Other;
};

// ── Directory Tab ─────────────────────────────────────────────────────────────
const DirectoryTab = ({ vendors }) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [ratingModal, setRatingModal] = useState(null); // { vendor }
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingNote, setRatingNote] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [localVendors, setLocalVendors] = useState(vendors);

  useEffect(() => { setLocalVendors(vendors); }, [vendors]);

  const filtered = useMemo(() => {
    return localVendors.filter((v) => {
      const text = `${v.name || ""} ${v.city || ""} ${(v.specializations || []).join(" ")}`.toLowerCase();
      return (!search || text.includes(search.toLowerCase())) &&
        (category === "All" || (v.specializations || []).includes(category));
    });
  }, [localVendors, search, category]);

  const categoryCounts = useMemo(() => {
    const c = {};
    CATEGORY_META.forEach(({ key }) => {
      c[key] = key === "All" ? localVendors.length : localVendors.filter((v) => (v.specializations || []).includes(key)).length;
    });
    return c;
  }, [localVendors]);

  const openRating = (vendor) => {
    setRatingModal(vendor);
    setRatingScore(vendor.avgRating ? Math.round(vendor.avgRating) : 0);
    setRatingNote("");
  };

  const submitRating = async () => {
    if (!ratingScore) return toast.error("Select a star rating.");
    setSavingRating(true);
    try {
      const { data } = await api.post(`/owner/vendors/${ratingModal._id}/rate`, { score: ratingScore, note: ratingNote });
      setLocalVendors((prev) => prev.map((v) => v._id === ratingModal._id
        ? { ...v, avgRating: data.avgRating, totalRatings: data.totalRatings }
        : v
      ));
      toast.success("Rating saved.");
      setRatingModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save rating.");
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/60 p-4 shadow-sm space-y-3">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor, city, specialization"
            className="input-field border-indigo-100 bg-white/90 shadow-sm" style={{ paddingLeft: "2rem" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
          {CATEGORY_META.map(({ key, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setCategory(key)}
              className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between gap-2 ${category === key ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white border-transparent shadow-md" : "bg-white/90 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/60"}`}>
              <span className="inline-flex items-center gap-1.5 min-w-0"><Icon size={13} className="shrink-0" /><span className="truncate">{key}</span></span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${category === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>{categoryCounts[key]}</span>
            </button>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState message="No vendors found for selected filters." icon={BriefcaseBusiness} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const theme = getVendorTheme(v.specializations?.[0] || "Other");
            return (
            <div key={v._id} className={`rounded-3xl border bg-white p-4 shadow-sm hover:shadow-lg transition-all overflow-hidden ${theme.card}`}>
              <div className={`-mx-4 -mt-4 mb-4 h-2 bg-gradient-to-r ${theme.glow}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${theme.icon}`}>
                    <BriefcaseBusiness size={18} />
                  </div>
                  <div className="min-w-0">
                  <p className="font-bold text-gray-900">{v.name}</p>
                  <p className={`text-xs mt-0.5 font-semibold ${theme.text}`}>{(v.specializations || []).join(", ") || "General"}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <StarRating value={v.avgRating || 0} readonly />
                    <span className="text-[10px] text-gray-400">
                      {v.avgRating ? `${Number(v.avgRating).toFixed(1)} (${v.totalRatings || 0})` : "Not rated"}
                    </span>
                  </div>
                </div>
                </div>
                {v.city && (
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${theme.chip}`}>
                    <MapPin size={10} /> {v.city}
                  </span>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-700 space-y-1.5">
                <p className="inline-flex items-center gap-1.5"><Phone size={12} /> {v.phone}</p>
                {v.email && <p className="inline-flex items-center gap-1.5"><Mail size={12} /> {v.email}</p>}
              </div>

              {(v.rateCard || []).length > 0 && (
                <div className={`mt-3 rounded-2xl bg-gradient-to-br p-3 space-y-1.5 border ${theme.panel}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${theme.text}`}>Rate Card</p>
                  {(v.rateCard || []).slice(0, 3).map((rc, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-gray-700">
                      <span>{rc.category}</span>
                      <span className="font-semibold">{formatCurrency(rc.rate)} / {rc.unit === "per-hour" ? "hr" : "job"}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${String(v.phone || "").replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                  <Phone size={12} /> Call
                </a>
                {v.email && (
                  <a href={`mailto:${v.email}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    <Mail size={12} /> Email
                  </a>
                )}
                <button onClick={() => openRating(v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                  <Star size={12} /> Rate
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Rate {ratingModal.name}</h3>
              <button onClick={() => setRatingModal(null)}><X size={18} /></button>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">Score:</p>
              <StarRating value={ratingScore} onChange={setRatingScore} />
              <span className="text-sm font-bold text-amber-500">{ratingScore ? `${ratingScore}/5` : ""}</span>
            </div>
            <textarea rows={3} value={ratingNote} onChange={(e) => setRatingNote(e.target.value)}
              placeholder="Optional: add a note about this vendor's work..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRatingModal(null)}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={submitRating} disabled={savingRating}
                className="px-4 py-2 text-sm rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-60">
                {savingRating ? "Saving..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Rate Cards Tab ─────────────────────────────────────────────────────────────
const RateContractTab = ({ vendors }) => {
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);
  const [localVendors, setLocalVendors] = useState(vendors);
  const [forms, setForms] = useState({});

  useEffect(() => { setLocalVendors(vendors); }, [vendors]);

  const toggleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
    if (!forms[id]) {
      const v = localVendors.find((x) => x._id === id);
      if (v) {
        setForms((prev) => ({
          ...prev,
          [id]: {
            rateCard: (v.rateCard || []).map((r) => ({ ...r })),
          },
        }));
      }
    }
  };

  const updateRateRow = (vendorId, idx, field, value) => {
    setForms((prev) => {
      const rows = [...(prev[vendorId]?.rateCard || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [vendorId]: { ...prev[vendorId], rateCard: rows } };
    });
  };

  const addRateRow = (vendorId) => {
    setForms((prev) => ({
      ...prev,
      [vendorId]: {
        ...prev[vendorId],
        rateCard: [...(prev[vendorId]?.rateCard || []), { category: "General", rate: "", unit: "per-job", notes: "" }],
      },
    }));
  };

  const removeRateRow = (vendorId, idx) => {
    setForms((prev) => {
      const rows = [...(prev[vendorId]?.rateCard || [])];
      rows.splice(idx, 1);
      return { ...prev, [vendorId]: { ...prev[vendorId], rateCard: rows } };
    });
  };

  const save = async (vendorId) => {
    setSaving(vendorId);
    try {
      const form = forms[vendorId];
      const { data } = await api.patch(`/owner/vendors/${vendorId}/rate-contract`, {
        rateCard: (form.rateCard || []).filter((r) => r.category && r.rate !== ""),
      });
      setLocalVendors((prev) => prev.map((v) => v._id === vendorId ? data.vendor : v));
      toast.success("Saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-3">
      {localVendors.length === 0 && <EmptyState message="No vendors in directory." icon={FileText} />}
      {localVendors.map((v) => {
        const open = expanded === v._id;
        const form = forms[v._id];
        const theme = getVendorTheme(v.specializations?.[0] || "Other");
        return (
          <div key={v._id} className={`rounded-3xl border bg-white shadow-sm overflow-hidden ${theme.card}`}>
            <button type="button" onClick={() => toggleExpand(v._id)}
              className={`w-full flex items-center justify-between p-4 transition-colors bg-gradient-to-r from-white via-white to-slate-50 hover:from-white hover:to-indigo-50/40`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${theme.icon}`}>
                  <BriefcaseBusiness size={16} className={theme.text} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{v.name}</p>
                  <p className={`text-xs font-semibold ${theme.text}`}>{(v.specializations || []).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {v.rateCard?.length > 0 && (
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.chip}`}>
                    {v.rateCard.length} rate{v.rateCard.length > 1 ? "s" : ""}
                  </span>
                )}
                {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {open && form && (
              <div className={`border-t p-4 space-y-4 bg-gradient-to-br ${theme.panel}`}>
                {/* Rate Card */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`font-bold text-sm flex items-center gap-1.5 ${theme.text}`}><Tag size={14} /> Service Rate Card</p>
                    <button onClick={() => addRateRow(v._id)} type="button"
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${theme.text}`}>
                      <Plus size={13} /> Add Row
                    </button>
                  </div>
                  {(form.rateCard || []).length === 0 && (
                    <p className="text-xs text-gray-500 italic bg-white/90 border border-dashed border-gray-200 rounded-xl px-4 py-3 text-center shadow-sm">No rates yet — click "Add Row" to define pricing for this vendor.</p>
                  )}
                  <div className="space-y-2">
                    {(form.rateCard || []).map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white/95 rounded-2xl p-2.5 border border-white shadow-sm">
                        <select value={row.category} onChange={(e) => updateRateRow(v._id, idx, "category", e.target.value)}
                          className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50">
                          {SPEC_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <div className="col-span-3 relative">
                          <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold ${theme.text}`}>₹</span>
                          <input type="number" min="0" value={row.rate}
                            onChange={(e) => updateRateRow(v._id, idx, "rate", e.target.value)}
                            placeholder="Rate" className="w-full border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50" />
                        </div>
                        <select value={row.unit} onChange={(e) => updateRateRow(v._id, idx, "unit", e.target.value)}
                          className="col-span-3 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50">
                          <option value="per-job">per job</option>
                          <option value="per-hour">per hour</option>
                        </select>
                        <input value={row.notes} onChange={(e) => updateRateRow(v._id, idx, "notes", e.target.value)}
                          placeholder="Notes" className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50" />
                        <button onClick={() => removeRateRow(v._id, idx)} type="button" className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => save(v._id)} disabled={saving === v._id}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.glow} text-white text-sm font-bold shadow-md disabled:opacity-60 transition-all`}
                  >
                    <Save size={14} /> {saving === v._id ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Invoices Tab ──────────────────────────────────────────────────────────────
const InvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/owner/vendor-invoices");
        setInvoices(data.invoices || []);
      } catch {
        toast.error("Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "All") return invoices;
    return invoices.filter((inv) => inv.invoice?.status === statusFilter);
  }, [invoices, statusFilter]);

  const totals = useMemo(() => ({
    pending: invoices.filter((i) => i.invoice?.status === "Pending").reduce((s, i) => s + (i.invoice?.amount || 0), 0),
    paid: invoices.filter((i) => i.invoice?.status === "Paid").reduce((s, i) => s + (i.invoice?.amount || 0), 0),
  }), [invoices]);

  const statusPill = (s) => ({
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }[s] || "bg-gray-100 text-gray-600 border-gray-200");

  if (loading) return <div className="flex justify-center py-16 text-gray-400 text-sm">Loading invoices...</div>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 shadow-sm">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Pending Payment</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{formatCurrency(totals.pending)}</p>
          <p className="text-xs text-amber-500 mt-0.5">{invoices.filter((i) => i.invoice?.status === "Pending").length} invoice(s)</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCurrency(totals.paid)}</p>
          <p className="text-xs text-emerald-500 mt-0.5">{invoices.filter((i) => i.invoice?.status === "Paid").length} invoice(s)</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["All", "Pending", "Paid"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === s ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No invoices found." icon={Receipt} />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const statusTone = inv.invoice?.status === "Paid"
              ? "border-emerald-200 before:bg-emerald-500"
              : inv.invoice?.status === "Pending"
                ? "border-amber-200 before:bg-amber-500"
                : "border-slate-200 before:bg-slate-400";
            return (
            <div key={inv.requestId} className={`relative rounded-3xl border bg-white p-4 shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-3xl ${statusTone}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{inv.category} Work</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusPill(inv.invoice?.status)}`}>
                      {inv.invoice?.status}
                    </span>
                  </div>
                  {inv.vendor && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <BriefcaseBusiness size={11} /> {inv.vendor.name}
                      {inv.vendor.avgRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 ml-1 text-amber-500">
                          <Star size={10} className="fill-amber-400" /> {Number(inv.vendor.avgRating).toFixed(1)}
                        </span>
                      )}
                    </p>
                  )}
                  {inv.property && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {inv.property.address?.city || inv.property.propertyType}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-gray-900">{formatCurrency(inv.invoice?.amount)}</p>
                  {inv.invoice?.raisedAt && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Raised: {new Date(inv.invoice.raisedAt).toLocaleDateString()}</p>
                  )}
                  {inv.invoice?.paidAt && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center justify-end gap-1">
                      <CheckCircle2 size={10} /> Paid: {new Date(inv.invoice.paidAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {inv.invoice?.description && (
                <p className="mt-3 text-xs text-gray-500 border-t border-slate-100 pt-3">{inv.invoice.description}</p>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TABS = [
  {
    key: "directory",
    label: "Directory",
    icon: BriefcaseBusiness,
    activeClass: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-md",
    inactiveClass: "bg-cyan-50/80 text-cyan-700 border-cyan-100 hover:bg-cyan-100/80",
  },
  {
    key: "rates",
    label: "Rate Cards",
    icon: Tag,
    activeClass: "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-md",
    inactiveClass: "bg-violet-50/80 text-violet-700 border-violet-100 hover:bg-violet-100/80",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: Receipt,
    activeClass: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-md",
    inactiveClass: "bg-emerald-50/80 text-emerald-700 border-emerald-100 hover:bg-emerald-100/80",
  },
];

const OwnerVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data } = await api.get("/owner/vendors");
        setVendors(data.vendors || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load vendors.");
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management"
        subtitle="Manage your vendor directory, rate cards, performance ratings, and invoice reconciliation."
        action={
          <Link to="/owner/maintenance"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2">
            <Wrench size={15} /> Open Maintenance
          </Link>
        }
      />

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-100/80 border border-slate-200 p-2 shadow-sm">
        {TABS.map(({ key, label, icon: Icon, activeClass, inactiveClass }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            className={`inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-xs font-bold border transition-all ${activeTab === key ? `${activeClass} border-transparent -translate-y-0.5` : `${inactiveClass} shadow-sm`}`}>
            <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "directory" && <DirectoryTab vendors={vendors} />}
      {activeTab === "rates" && <RateContractTab vendors={vendors} />}
      {activeTab === "invoices" && <InvoicesTab />}
    </div>
  );
};

export default OwnerVendors;

