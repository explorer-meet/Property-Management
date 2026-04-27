import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Wrench,
  Phone,
  Mail,
  Plus,
  CheckCircle2,
  Clock3,
  XCircle,
  BadgeCheck,
  LogOut,
  X,
  Building2,
  MapPin,
  StickyNote,
  LayoutDashboard,
  UserCheck,
  HomeIcon,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Menu,
} from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { logout } from "../../app/slices/authSlice";

const CATEGORIES = ["Electric", "Plumbing", "General", "Carpentry", "Painting", "Other"];
const LEAD_STATUS_OPTIONS = ["All", "New", "Contacted", "Approved", "Rejected"];

const leadStatusClass = (status) => {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Rejected") return "bg-rose-100 text-rose-700 border-rose-200";
  if (status === "Contacted") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const emptyVendorForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  specializations: ["General"],
  notes: "",
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [insightType, setInsightType] = useState("owners");
  const [insightItems, setInsightItems] = useState([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightSummary, setInsightSummary] = useState(null);
  const [expandedInsightRows, setExpandedInsightRows] = useState({});
  const [entityActionLoading, setEntityActionLoading] = useState({});
  const [insightStatusFilter, setInsightStatusFilter] = useState("all");
  const [actionConfirm, setActionConfirm] = useState(null);

  // Filters
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("All");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const loadInsightList = async (type, status = insightStatusFilter) => {
    setInsightType(type);
    setInsightLoading(true);
    try {
      const res = await api.get(`/admin/insights?type=${type}&status=${status}`);
      setInsightItems(res.data.items || []);
      setInsightSummary(res.data.summary || null);
      setExpandedInsightRows({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load details.");
    } finally {
      setInsightLoading(false);
    }
  };

  const toggleInsightRow = (id) => {
    setExpandedInsightRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getLifecycleStatusLabel = (item) => {
    if (item.isActive === false) return "Deactivated";
    if (item.lifecycleStatus === "Inactive") return "Deactivated";
    return "Active";
  };

  const handleEntityAction = async (type, entityId, action) => {
    const loadingKey = `${type}-${entityId}-${action}`;
    setEntityActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      await api.patch(`/admin/entities/${type}/${entityId}/status`, { action });
      toast.success(`Marked as ${action}.`);
      await loadInsightList(type, insightStatusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} entry.`);
    } finally {
      setEntityActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const getEntityPreviewLabel = (type, item) => {
    if (type === "properties") {
      return `${item.propertyType || "Property"} ${item.address?.city ? `(${item.address.city})` : ""}`.trim();
    }
    if (type === "leases") {
      return `${item.tenant?.name || item.tenant?.email || "Tenant"} | ${item.property?.propertyType || "Property"}`;
    }
    return item.name || [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ") || item.email || "User";
  };

  const requestEntityAction = (type, item, action) => {
    if (action === "active") {
      handleEntityAction(type, item._id, action);
      return;
    }

    const entityLabel = getEntityPreviewLabel(type, item);
    setActionConfirm({
      type,
      entityId: item._id,
      action,
      entityLabel,
      title: action === "delete" ? "Confirm Delete" : "Confirm Deactivate",
      description:
        action === "delete"
          ? `This will permanently remove ${entityLabel} where allowed.`
          : `This will mark ${entityLabel} as deactivated until re-activated.`,
    });
  };

  const confirmEntityAction = async () => {
    if (!actionConfirm) return;
    const payload = actionConfirm;
    setActionConfirm(null);
    await handleEntityAction(payload.type, payload.entityId, payload.action);
  };

  const fetchData = async () => {
    try {
      const [vendorRes, leadRes, statsRes] = await Promise.all([
        api.get("/admin/vendors"),
        api.get("/admin/vendor-leads"),
        api.get("/admin/stats"),
      ]);
      setVendors(vendorRes.data.vendors || []);
      setLeads(leadRes.data.leads || []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadInsightList("owners");
  }, []);

  useEffect(() => {
    if (!loading) {
      loadInsightList(insightType, insightStatusFilter);
    }
  }, [insightStatusFilter]);

  const createVendor = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/vendors", vendorForm);
      toast.success("Vendor added to directory.");
      setVendorForm(emptyVendorForm);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vendor.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateVendor = async (id) => {
    if (!window.confirm("Deactivate this vendor from directory?")) return;
    try {
      await api.delete(`/admin/vendors/${id}`);
      toast.success("Vendor deactivated.");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate vendor.");
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      const res = await api.patch(`/admin/vendor-leads/${leadId}/status`, { status });
      setLeads((prev) => prev.map((lead) => (lead._id === leadId ? { ...lead, status } : lead)));
      if (status === "Approved") {
        const credentials = res.data?.provisioning?.credentials;
        if (credentials?.email && credentials?.defaultPassword) {
          toast.success(
            `Lead approved. Vendor login created for ${credentials.email}. Default password: ${credentials.defaultPassword}`
          );
        } else {
          toast.success("Lead approved — vendor added to directory.");
        }
        const syncedVendor = res.data?.vendor;
        if (syncedVendor) {
          setVendors((prev) => {
            const exists = prev.some((v) => v._id === syncedVendor._id);
            if (exists) {
              return prev.map((v) => (v._id === syncedVendor._id ? syncedVendor : v));
            }
            return [syncedVendor, ...prev];
          });
        }
        setVendorCategoryFilter("All");
        setActiveSection("vendors");
        fetchData(); // authoritative refresh
      } else {
        toast.success("Lead status updated.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading admin console…</p>
        </div>
      </div>
    );

  const newLeads = leads.filter((l) => l.status === "New").length;
  const activeVendors = vendors.filter((v) => v.isActive !== false).length;

  const filteredVendors =
    vendorCategoryFilter === "All"
      ? vendors
      : vendors.filter((v) => (v.specializations || []).includes(vendorCategoryFilter));

  const filteredLeads =
    leadStatusFilter === "All" ? leads : leads.filter((l) => l.status === leadStatusFilter);

  // ── Sidebar navigation items ────────────────────────────────────
  const navGroups = [
    {
      groupLabel: "Platform Insights",
      items: [
        { key: "overview", label: "Overview", icon: BarChart3 },
        { key: "owners", label: "Owners", icon: UserCheck, count: stats?.totalOwners ?? 0 },
        { key: "tenants", label: "Tenants", icon: Users, count: stats?.totalTenants ?? 0 },
        { key: "properties", label: "Properties", icon: HomeIcon, count: stats?.totalProperties ?? 0 },
        { key: "leases", label: "Leases", icon: ShieldCheck, count: stats?.totalLeases ?? 0 },
      ],
    },
    {
      groupLabel: "Vendor Management",
      items: [
        { key: "vendors", label: "Vendor Directory", icon: Wrench, count: activeVendors },
        { key: "leads", label: "Vendor Leads", icon: TrendingUp, count: newLeads, badge: newLeads > 0 },
      ],
    },
  ];

  const handleSectionChange = (key) => {
    setActiveSection(key);
    setSidebarOpen(false);
    if (["owners", "tenants", "properties", "leases"].includes(key)) {
      setInsightStatusFilter("all");
      setInsightType(key);
      loadInsightList(key, "all");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50 to-blue-50 flex flex-col">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-indigo-100/80 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            {/* mobile hamburger */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200">
                <LayoutDashboard size={17} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">Admin Console</p>
                <p className="text-[11px] text-indigo-400 font-medium">PropManager</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm px-3.5 py-2 transition-colors"
          >
            <LogOut size={15} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full min-h-0">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 shadow-xl lg:shadow-none flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          style={{ top: 64 }}
        >
          {/* close button on mobile */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Navigation</p>
            <button type="button" onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={15} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.groupLabel}>
                <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{group.groupLabel}</p>
                <div className="space-y-1">
                  {group.items.map(({ key, label, icon: Icon, count, badge }) => {
                    const active = activeSection === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSectionChange(key)}
                        className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                          active
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200"
                            : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2.5">
                          <Icon size={15} className={active ? "text-white" : "text-indigo-400"} />
                          {label}
                        </span>
                        {typeof count === "number" && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              active
                                ? badge
                                  ? "bg-amber-400 text-amber-900"
                                  : "bg-white/20 text-white"
                                : badge
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 py-4 border-t border-gray-100">
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-3 text-xs text-indigo-700">
              <p className="font-semibold">Admin Access</p>
              <p className="text-indigo-500 mt-0.5 text-[11px]">Full platform control</p>
            </div>
          </div>
        </aside>

        {/* overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* ── Hero ──────────────────────────────────────────── */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 px-7 py-6 text-white shadow-xl overflow-hidden relative">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-indigo-500/10 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-300 font-semibold">Platform Operations</p>
              <h1 className="mt-1.5 text-2xl lg:text-3xl font-extrabold leading-tight">Admin Dashboard</h1>
              <p className="mt-1.5 text-sm text-blue-200 max-w-xl">
                Full control over owners, tenants, properties, leases, vendors and leads — all from one unified console.
              </p>
            </div>
          </div>

          {/* ── Overview Section ─────────────────────────────── */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Owners", value: stats?.totalOwners ?? "—", icon: UserCheck, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", sectionKey: "owners" },
                  { label: "Tenants", value: stats?.totalTenants ?? "—", icon: Users, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", sectionKey: "tenants" },
                  { label: "Properties", value: stats?.totalProperties ?? "—", icon: HomeIcon, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", sectionKey: "properties" },
                  { label: "Leases", value: stats?.totalLeases ?? "—", icon: ShieldCheck, bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", sectionKey: "leases" },
                  { label: "Active Vendors", value: activeVendors, icon: Wrench, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", sectionKey: "vendors" },
                  { label: "New Leads", value: newLeads, icon: TrendingUp, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", sectionKey: "leads" },
                ].map(({ label, value, icon: Icon, bg, text, border, sectionKey }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSectionChange(sectionKey)}
                    className={`rounded-2xl border ${border} ${bg} p-4 flex flex-col gap-2 text-left hover:shadow-md hover:-translate-y-0.5 transition-all`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                      <Icon size={17} className={text} />
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                    <p className={`text-xs font-semibold ${text}`}>{label}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Users breakdown */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/40">
                    <Users size={16} className="text-indigo-500" />
                    <h2 className="font-bold text-gray-900">Registered Users</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {[
                      { label: "Property Owners", sub: "Registered as owner", value: stats?.totalOwners ?? "—", color: "indigo", Icon: UserCheck },
                      { label: "Tenants", sub: "Registered as tenant", value: stats?.totalTenants ?? "—", color: "blue", Icon: Users },
                    ].map(({ label, sub, value, color, Icon }) => (
                      <div key={label} className={`flex items-center justify-between rounded-2xl bg-${color}-50 border border-${color}-100 px-4 py-4`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                            <Icon size={17} className={`text-${color}-600`} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{label}</p>
                            <p className="text-xs text-gray-500">{sub}</p>
                          </div>
                        </div>
                        <p className={`text-3xl font-extrabold text-${color}-600`}>{value}</p>
                      </div>
                    ))}
                    {stats && (stats.totalOwners + stats.totalTenants) > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                          <span>Owners</span><span>Tenants</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-blue-100 overflow-hidden flex">
                          <div
                            className="h-full bg-indigo-500 rounded-l-full transition-all"
                            style={{ width: `${(stats.totalOwners / (stats.totalOwners + stats.totalTenants)) * 100}%` }}
                          />
                          <div className="h-full bg-blue-400 flex-1 rounded-r-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Summary */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-emerald-50/40">
                    <Wrench size={16} className="text-emerald-500" />
                    <h2 className="font-bold text-gray-900">Vendor Summary</h2>
                  </div>
                  <div className="p-5 space-y-2.5">
                    {[
                      { label: "Active Vendors", value: activeVendors, sub: "In app directory", color: "emerald" },
                      { label: "Total Leads", value: leads.length, sub: "Partnership requests", color: "blue" },
                      { label: "New Leads", value: newLeads, sub: "Awaiting review", color: "amber" },
                      { label: "Approved Leads", value: leads.filter((l) => l.status === "Approved").length, sub: "Added to directory", color: "indigo" },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl bg-${color}-50 border border-${color}-100`}>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{label}</p>
                          <p className={`text-xs text-${color}-600`}>{sub}</p>
                        </div>
                        <p className={`text-2xl font-extrabold text-${color}-600`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Entity Insight Sections (owners / tenants / properties / leases) ── */}
          {["owners", "tenants", "properties", "leases"].includes(activeSection) && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/40 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900 capitalize">{activeSection}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and inspect {activeSection} on the platform.</p>
                </div>
              </div>
              <div className="p-5">
                {insightLoading ? (
                  <div className="py-16 text-center text-sm text-gray-500">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                    Loading {activeSection}...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-white via-indigo-50/40 to-cyan-50/40 p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Status Filter</span>
                        <span className="text-[11px] text-gray-500">Showing {insightItems.length} record{insightItems.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                        {[
                          { key: "all", label: "All", count: insightSummary?.total ?? insightItems.length, activeStyle: "border-slate-600 bg-slate-600 text-white" },
                          { key: "active", label: "Active", count: insightSummary?.active ?? 0, activeStyle: "border-emerald-600 bg-emerald-600 text-white" },
                          { key: "deactivated", label: "Deactivated", count: insightSummary?.deactivated ?? 0, activeStyle: "border-amber-600 bg-amber-500 text-white" },
                          { key: "clear", label: "Clear", activeStyle: "border-rose-500 bg-rose-500 text-white" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setInsightStatusFilter(option.key === "clear" ? "all" : option.key)}
                            className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                              option.key === "clear"
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : insightStatusFilter === option.key
                                  ? option.activeStyle
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span className="inline-flex items-center justify-center gap-1.5">
                              <span>{option.label}</span>
                              {typeof option.count === "number" ? (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                                  insightStatusFilter === option.key
                                    ? "bg-white/20 text-white"
                                    : option.key === "active" ? "bg-emerald-100 text-emerald-700"
                                    : option.key === "deactivated" ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}>{option.count}</span>
                              ) : null}
                            </span>
                          </button>
                        ))}
                      </div>
                      {insightStatusFilter !== "all" && (
                        <p className="mt-2 text-[11px] text-gray-500">
                          Showing only <span className="font-semibold capitalize text-gray-700">{insightStatusFilter}</span> records.
                        </p>
                      )}
                    </div>

                    {insightItems.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                        No records found for the selected filter. Use <span className="font-semibold text-rose-600">Clear</span> to reset.
                      </div>
                    ) : insightItems.map((item, index) => {
                      const expanded = expandedInsightRows[item._id] !== false;
                      const statusLabel = getLifecycleStatusLabel(item);
                      const isActiveEntity = statusLabel === "Active";
                      const displayName = item.name || [item.firstName, item.middleName, item.lastName].filter(Boolean).join(" ") || "Unnamed User";
                      const actionButtons = [
                        { key: "active", label: "Active", style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                        { key: "deactivate", label: "Deactivate", style: "border-amber-200 bg-amber-50 text-amber-700" },
                        { key: "delete", label: "Delete", style: "border-rose-200 bg-rose-50 text-rose-700" },
                      ];
                      return (
                        <div key={item._id} className="rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition-colors">
                          <div className="p-3 sm:p-4 flex flex-col gap-3">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-400">{index + 1}.</p>
                                    {activeSection === "properties" ? (
                                      <>
                                        <p className="text-sm font-bold text-gray-900 truncate">Property: {item.propertyType || "N/A"}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {(item.address?.street || "").trim() || "Address not provided"}
                                          {item.address?.city ? `, ${item.address.city}` : ""}
                                        </p>
                                      </>
                                    ) : activeSection === "leases" ? (
                                      <>
                                        <p className="text-sm font-bold text-gray-900 truncate">Lease: {item.tenant?.name || item.tenant?.email || "Tenant N/A"}</p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {item.property?.propertyType || "Property"} | {item.owner?.name || item.owner?.email || "Owner N/A"}
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                                        <p className="text-xs text-gray-500 truncate">{item.email || "No email"}</p>
                                      </>
                                    )}
                                  </div>
                                  {(activeSection === "properties" || activeSection === "leases") && (
                                    <button
                                      type="button"
                                      onClick={() => toggleInsightRow(item._id)}
                                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 shrink-0"
                                    >
                                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {(activeSection === "properties" || activeSection === "leases") && (
                                <div className="flex gap-2 flex-wrap shrink-0">
                                  {actionButtons.map((action) => {
                                    const lk = `${activeSection}-${item._id}-${action.key}`;
                                    const busy = !!entityActionLoading[lk];
                                    return (
                                      <button key={action.key} type="button" disabled={busy}
                                        onClick={() => requestEntityAction(activeSection, item, action.key)}
                                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                                          action.key === "active" && isActiveEntity ? "border-emerald-600 bg-emerald-600 text-white"
                                          : action.key === "deactivate" && !isActiveEntity ? "border-amber-600 bg-amber-500 text-white"
                                          : action.style
                                        }`}
                                      >
                                        {busy ? "Please wait..." : action.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {expanded && (
                              <div className="rounded-lg border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-3 text-xs text-gray-700 space-y-3">
                                {activeSection === "properties" ? (
                                  <>
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold uppercase tracking-wider text-emerald-900">Property Snapshot</p>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">{item.status || "N/A"}</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p><span className="font-semibold">Type:</span> {item.propertyType || "N/A"}</p>
                                        <p><span className="font-semibold">Rooms:</span> {item.numberOfRooms ?? "N/A"}</p>
                                        <p><span className="font-semibold">Photos:</span> {(item.photoUrls || []).length}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2">
                                      <p className="font-semibold uppercase tracking-wider text-blue-900">Address Details</p>
                                      <p><span className="font-semibold">Street:</span> {item.address?.street || "N/A"}</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <p><span className="font-semibold">City:</span> {item.address?.city || "N/A"}</p>
                                        <p><span className="font-semibold">State:</span> {item.address?.state || "N/A"}</p>
                                        <p><span className="font-semibold">Pincode:</span> {item.address?.pincode || "N/A"}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                                      <p className="font-semibold uppercase tracking-wider text-indigo-900">Owner Details</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p><span className="font-semibold">Name:</span> {item.owner?.name || "N/A"}</p>
                                        <p><span className="font-semibold">Email:</span> {item.owner?.email || "N/A"}</p>
                                        <p className="sm:col-span-2"><span className="font-semibold">Phone:</span> {item.owner?.phone || "N/A"}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-1">
                                      <p className="font-semibold uppercase tracking-wider text-gray-700">Timeline</p>
                                      <p><span className="font-semibold">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</p>
                                      <p><span className="font-semibold">Updated:</span> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A"}</p>
                                      <p><span className="font-semibold">Description:</span> {item.description || "N/A"}</p>
                                    </div>
                                  </>
                                ) : activeSection === "leases" ? (
                                  <>
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold uppercase tracking-wider text-emerald-900">Lease Snapshot</p>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">{statusLabel}</span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p><span className="font-semibold">Rent:</span> {Number(item.rentAmount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
                                        <p><span className="font-semibold">Deposit:</span> {Number(item.securityDeposit || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
                                        <p><span className="font-semibold">Start:</span> {item.leaseStartDate ? new Date(item.leaseStartDate).toLocaleDateString() : "N/A"}</p>
                                        <p><span className="font-semibold">End:</span> {item.leaseEndDate ? new Date(item.leaseEndDate).toLocaleDateString() : "N/A"}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                                      <p className="font-semibold uppercase tracking-wider text-indigo-900">Participants</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p><span className="font-semibold">Owner:</span> {item.owner?.name || item.owner?.email || "N/A"}</p>
                                        <p><span className="font-semibold">Tenant:</span> {item.tenant?.name || item.tenant?.email || "N/A"}</p>
                                        <p><span className="font-semibold">Owner Phone:</span> {item.owner?.phone || "N/A"}</p>
                                        <p><span className="font-semibold">Tenant Phone:</span> {item.tenant?.phone || "N/A"}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2">
                                      <p className="font-semibold uppercase tracking-wider text-blue-900">Property</p>
                                      <p><span className="font-semibold">Type:</span> {item.property?.propertyType || "N/A"}</p>
                                      <p><span className="font-semibold">Address:</span> {[item.property?.address?.street, item.property?.address?.city, item.property?.address?.state, item.property?.address?.pincode].filter(Boolean).join(", ") || "N/A"}</p>
                                      <p><span className="font-semibold">Occupancy:</span> {item.property?.status || "N/A"}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-1">
                                      <p className="font-semibold uppercase tracking-wider text-gray-700">Timeline</p>
                                      <p><span className="font-semibold">Created:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</p>
                                      <p><span className="font-semibold">Rent Due Day:</span> {item.rentDueDay || "N/A"}</p>
                                      <p><span className="font-semibold">Grace Days:</span> {item.graceDays || 0}</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold uppercase tracking-wider text-emerald-900">Account Snapshot</p>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                          {(item.role || activeSection.slice(0, -1)).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex gap-2 flex-wrap">
                                        {actionButtons.map((action) => {
                                          const lk = `${activeSection}-${item._id}-${action.key}`;
                                          const busy = !!entityActionLoading[lk];
                                          return (
                                            <button key={action.key} type="button" disabled={busy}
                                              onClick={() => requestEntityAction(activeSection, item, action.key)}
                                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                                                action.key === "active" && isActiveEntity ? "border-emerald-600 bg-emerald-600 text-white"
                                                : action.key === "deactivate" && !isActiveEntity ? "border-amber-600 bg-amber-500 text-white"
                                                : action.style
                                              }`}
                                            >{busy ? "Please wait..." : action.label}</button>
                                          );
                                        })}
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <p><span className="font-semibold">Name:</span> {displayName}</p>
                                        <p><span className="font-semibold">Email:</span> {item.email || "N/A"}</p>
                                        <p><span className="font-semibold">Phone:</span> {item.phone || "N/A"}</p>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-1">
                                      <p className="font-semibold uppercase tracking-wider text-indigo-900">Timeline</p>
                                      <p><span className="font-semibold">Joined:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</p>
                                      <p><span className="font-semibold">Last Updated:</span> {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A"}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Vendor Directory Section ─────────────────────── */}
          {activeSection === "vendors" && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-emerald-50/40">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-emerald-500" />
                  <h2 className="font-bold text-gray-900">Vendor Directory</h2>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">{filteredVendors.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setVendorForm(emptyVendorForm); setShowAddModal(true); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm px-4 py-2 shadow transition-all"
                >
                  <Plus size={15} /> Add Vendor
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-white">
                <Filter size={13} className="text-gray-400 shrink-0" />
                {["All", ...CATEGORIES].map((cat) => (
                  <button key={cat} type="button" onClick={() => setVendorCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      vendorCategoryFilter === cat
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >{cat}</button>
                ))}
              </div>

              <div className="p-5">
                {filteredVendors.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                      <Wrench size={24} className="text-indigo-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {vendorCategoryFilter === "All" ? "No vendors yet" : `No vendors for "${vendorCategoryFilter}"`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {vendorCategoryFilter === "All" ? 'Click "Add Vendor" to add the first entry.' : "Try a different category."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredVendors.map((v) => (
                      <div key={v._id} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                              <Wrench size={18} className="text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{v.name}</p>
                              {v.city && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} className="shrink-0" /> {v.city}</p>}
                            </div>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${v.isActive !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                            {v.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(v.specializations || ["General"]).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">{s}</span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1.5 border-t border-gray-100 pt-3">
                          <p className="flex items-center gap-1.5"><Phone size={12} className="text-indigo-400 shrink-0" /> {v.phone}</p>
                          {v.email && <p className="flex items-center gap-1.5"><Mail size={12} className="text-indigo-400 shrink-0" /> {v.email}</p>}
                          {v.notes && <p className="flex items-start gap-1.5 text-gray-400"><StickyNote size={12} className="mt-0.5 shrink-0" /> {v.notes}</p>}
                        </div>
                        <button type="button" onClick={() => deactivateVendor(v._id)}
                          className="mt-auto w-full rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors">
                          Deactivate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Vendor Leads Section ─────────────────────────── */}
          {activeSection === "leads" && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-amber-50/40">
                <TrendingUp size={16} className="text-amber-500" />
                <h2 className="font-bold text-gray-900">Vendor Leads</h2>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{filteredLeads.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-white">
                <Filter size={13} className="text-gray-400 shrink-0" />
                {LEAD_STATUS_OPTIONS.map((s) => {
                  const count = s === "All" ? leads.length : leads.filter((l) => l.status === s).length;
                  return (
                    <button key={s} type="button" onClick={() => setLeadStatusFilter(s)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        leadStatusFilter === s
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      {s}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${leadStatusFilter === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {filteredLeads.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp size={24} className="text-amber-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {leadStatusFilter === "All" ? "No vendor leads yet" : `No "${leadStatusFilter}" leads`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {leadStatusFilter === "All" ? "Leads from the landing page will appear here." : "Try a different status."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredLeads.map((lead) => (
                      <div key={lead._id} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-bold text-gray-900">{lead.companyName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Contact: {lead.contactName}</p>
                            {lead.city && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={10} className="shrink-0" /> {lead.city}</p>}
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${leadStatusClass(lead.status)}`}>
                            {lead.status === "Approved" && <BadgeCheck size={12} />}
                            {lead.status === "Rejected" && <XCircle size={12} />}
                            {lead.status === "Contacted" && <Clock3 size={12} />}
                            {lead.status === "New" && <CheckCircle2 size={12} />}
                            {lead.status}
                          </span>
                        </div>
                        {(lead.specializations || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {lead.specializations.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{s}</span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-3">
                          <p className="flex items-center gap-1.5"><Phone size={12} className="text-indigo-400 shrink-0" /> {lead.phone}</p>
                          <p className="flex items-center gap-1.5"><Mail size={12} className="text-indigo-400 shrink-0" /> {lead.email}</p>
                        </div>
                        {lead.message && (
                          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 leading-relaxed">{lead.message}</p>
                        )}
                        <div className="pt-1">
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Update Status</label>
                          <select
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                          >
                            {["New", "Contacted", "Approved", "Rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Action Confirm Modal ─────────────────────────────── */}
      {actionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            <div className={`px-5 py-4 border-b ${actionConfirm.action === "delete" ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"}`}>
              <h3 className={`text-sm font-bold ${actionConfirm.action === "delete" ? "text-rose-800" : "text-amber-800"}`}>{actionConfirm.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{actionConfirm.description}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700">Target: <span className="font-semibold text-gray-900">{actionConfirm.entityLabel}</span></p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setActionConfirm(null)}
                className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmEntityAction}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold text-white ${actionConfirm.action === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                Confirm {actionConfirm.action === "delete" ? "Delete" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Vendor Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600"><Plus size={16} /></div>
                <div>
                  <h3 className="font-bold text-gray-900">Add Vendor</h3>
                  <p className="text-xs text-gray-500">New entry to the app vendor directory</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createVendor} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Vendor Name *</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input required className="input-field" style={{ paddingLeft: "2rem" }} placeholder="e.g. Ramesh Electrical Works"
                      value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Phone *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input required className="input-field" style={{ paddingLeft: "2rem" }} placeholder="Phone number"
                      value={vendorForm.phone} onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input className="input-field" style={{ paddingLeft: "2rem" }} placeholder="Email"
                      value={vendorForm.email} onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input className="input-field" style={{ paddingLeft: "2rem" }} placeholder="City"
                      value={vendorForm.city} onChange={(e) => setVendorForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const active = vendorForm.specializations.includes(c);
                    return (
                      <button key={c} type="button"
                        onClick={() => setVendorForm((prev) => {
                          const next = prev.specializations.includes(c)
                            ? prev.specializations.filter((x) => x !== c)
                            : [...prev.specializations, c];
                          return { ...prev, specializations: next.length ? next : ["General"] };
                        })}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                          active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                        }`}
                      >{c}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
                <textarea rows={3} className="input-field" placeholder="Coverage area, team size, working hours…"
                  value={vendorForm.notes} onChange={(e) => setVendorForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm px-4 py-2.5 disabled:opacity-60 shadow transition-all">
                  <Plus size={15} /> {saving ? "Saving…" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
