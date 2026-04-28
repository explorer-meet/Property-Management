import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  Mail,
  MessageCircle,
  Phone,
  Rocket,
  BellRing,
  Home,
  ClipboardList,
  TrendingUp,
  Clock3,
  Wrench,
  MapPin,
  DoorOpen,
  RefreshCcw,
  ShieldCheck,
  Bell,
  Receipt,
  BarChart2,
  Star,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const MetricCard = ({ title, value, subtitle, icon: Icon, accent = "blue", onClick }) => {
  const accentMap = {
    blue: {
      gradient: "from-sky-500 to-blue-600",
      border: "border-sky-100",
      bg: "bg-sky-50/90",
      label: "text-sky-700",
      value: "text-sky-950",
    },
    green: {
      gradient: "from-emerald-500 to-teal-600",
      border: "border-emerald-100",
      bg: "bg-emerald-50/90",
      label: "text-emerald-700",
      value: "text-emerald-950",
    },
    amber: {
      gradient: "from-amber-400 to-orange-500",
      border: "border-amber-100",
      bg: "bg-amber-50/90",
      label: "text-amber-700",
      value: "text-amber-950",
    },
    rose: {
      gradient: "from-rose-500 to-red-500",
      border: "border-rose-100",
      bg: "bg-rose-50/90",
      label: "text-rose-700",
      value: "text-rose-950",
    },
  };

  const tone = accentMap[accent] || accentMap.blue;
  const cardClass = [
    "relative overflow-hidden rounded-3xl border p-5 text-left shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all",
    tone.border,
    tone.bg,
    onClick ? "hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.10)]" : "",
  ].join(" ");

  const content = (
    <div className={cardClass}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90 ${tone.gradient}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${tone.label}`}>{title}</p>
          <p className={`mt-3 text-3xl font-extrabold leading-none ${tone.value}`}>{value}</p>
          {subtitle ? <p className="mt-2 text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tone.gradient} p-3 text-white shadow-lg`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};

const QuickNavCard = ({ title, subtitle, icon: Icon, onClick, accent = "blue" }) => {
  const accentMap = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-white/70 bg-white/95 p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl border p-2.5 ${accentMap[accent] || accentMap.blue}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </button>
  );
};

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [updatingInquiryId, setUpdatingInquiryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSectionTab, setActiveSectionTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: dashboardData }, { data: inquiryData }, { data: maintenanceData }, { data: rentData }] = await Promise.all([
          api.get("/owner/dashboard"),
          api.get("/owner/inquiries"),
          api.get("/owner/maintenance"),
          api.get("/owner/rent"),
        ]);

        const inquiries = inquiryData?.inquiries || [];
        const requests = maintenanceData?.requests || [];
        const rents = rentData?.rents || [];

        setStats(dashboardData.stats || null);
        setRecentInquiries(inquiries.slice(0, 8));

        const overdueRents = rents.filter((rent) => rent.status === "Overdue");
        const highPriorityRequests = requests.filter((req) => ["High", "Emergency"].includes(req.urgency));

        const nextAlerts = [];
        if (overdueRents.length) {
          nextAlerts.push({
            id: "overdue",
            title: `${overdueRents.length} overdue rent record(s)`,
            detail: "Follow up with tenants to reduce cashflow risk.",
          });
        }
        if (highPriorityRequests.length) {
          nextAlerts.push({
            id: "maintenance",
            title: `${highPriorityRequests.length} high-priority maintenance request(s)`,
            detail: "Urgent requests need quick action.",
          });
        }

        setAlerts(nextAlerts);
      } catch {
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateInquiryStatus = async (inquiryId, status) => {
    try {
      setUpdatingInquiryId(inquiryId);
      await api.patch(`/owner/inquiries/${inquiryId}/status`, { status });
      setRecentInquiries((prev) => prev.map((item) => (item._id === inquiryId ? { ...item, status } : item)));
      toast.success("Inquiry status updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update inquiry status.");
    } finally {
      setUpdatingInquiryId("");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const ownerDisplayName = user?.firstName || user?.name?.split(" ")?.[0] || "Owner";
  const pendingRent = Number(stats?.pendingRent || 0);
  const overdueRent = Number(stats?.overdueRent || 0);
  const paidRent = Number(stats?.totalPaidAmount || 0);
  const totalProperties = Number(stats?.totalProperties || 0);
  const occupiedProperties = Number(stats?.occupiedProperties || 0);
  const vacantProperties = Number(stats?.vacantProperties || 0);
  const activeLeases = Number(stats?.activeLeases || 0);
  const openMaintenanceRequests = Number(stats?.openMaintenanceRequests || 0);
  const totalInquiries = Number(stats?.totalInquiries || 0);
  const newInquiries = Number(stats?.newInquiries || 0);
  const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
  const vacancyRate = totalProperties > 0 ? (vacantProperties / totalProperties) * 100 : 0;
  const activeLeadCount = recentInquiries.filter((item) => item.status !== "Closed").length;
  const attentionCount = Number(openMaintenanceRequests) + Number(newInquiries) + (overdueRent > 0 ? 1 : 0);
  const portfolioHealthTone = occupancyRate >= 80 ? "Strong" : occupancyRate >= 60 ? "Stable" : "Needs Attention";

  const inquiryTotals = recentInquiries.reduce(
    (acc, inquiry) => {
      const status = (inquiry.status || "New").toLowerCase();
      if (status === "new") acc.new += 1;
      else if (status === "in progress") acc.inProgress += 1;
      else if (status === "contacted") acc.contacted += 1;
      else if (status === "closed") acc.closed += 1;
      return acc;
    },
    { new: 0, inProgress: 0, contacted: 0, closed: 0 }
  );

  const sectionTabs = [
    {
      id: "overview",
      label: "Portfolio Overview",
      icon: Home,
      helper: "KPIs and financial snapshot",
      activeClass: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-700 shadow-[0_8px_24px_rgba(6,182,212,0.18)]",
      iconClass: "bg-cyan-100 text-cyan-700 border-cyan-200",
      helperClass: "text-cyan-600",
      idleClass: "hover:border-cyan-200 hover:bg-cyan-50/60",
    },
    {
      id: "leads",
      label: "Leads & Growth",
      icon: MessageCircle,
      helper: "Inquiries and conversion flow",
      activeClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700 shadow-[0_8px_24px_rgba(245,158,11,0.2)]",
      iconClass: "bg-amber-100 text-amber-700 border-amber-200",
      helperClass: "text-amber-600",
      idleClass: "hover:border-amber-200 hover:bg-amber-50/60",
    },
    {
      id: "operations",
      label: "Operations",
      icon: ClipboardList,
      helper: "Alerts and execution focus",
      activeClass: "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 shadow-[0_8px_24px_rgba(244,63,94,0.2)]",
      iconClass: "bg-rose-100 text-rose-700 border-rose-200",
      helperClass: "text-rose-600",
      idleClass: "hover:border-rose-200 hover:bg-rose-50/60",
    },
  ];

  const quickNavItems = [
    { title: "Properties", subtitle: "Manage listings, unit details, and availability", icon: Building2, onClick: () => navigate("/owner/properties"), accent: "blue" },
    { title: "Tenants & Leases", subtitle: "Review active leases and tenant lifecycle", icon: Users, onClick: () => navigate("/owner/tenants"), accent: "green" },
    { title: "Rent Management", subtitle: "Track pending, paid, and overdue rent cycles", icon: Wallet, onClick: () => navigate("/owner/rent"), accent: "amber" },
    { title: "Expense Tracker", subtitle: "Log repairs, bills, and property-level costs", icon: Receipt, onClick: () => navigate("/owner/expenses"), accent: "blue" },
    { title: "Advanced Analytics", subtitle: "See income vs expense trends and tax insights", icon: BarChart2, onClick: () => navigate("/owner/analytics"), accent: "violet" },
    { title: "Property Reviews", subtitle: "Understand tenant feedback and improve retention", icon: Star, onClick: () => navigate("/owner/reviews"), accent: "rose" },
    { title: "Vacancies", subtitle: "Promote vacant inventory and fill empty units", icon: MapPin, onClick: () => navigate("/owner/vacancies"), accent: "violet" },
    { title: "Maintenance", subtitle: "Handle service requests and urgent issues", icon: Wrench, onClick: () => navigate("/owner/maintenance"), accent: "rose" },
    { title: "Notifications", subtitle: "Check recent updates and platform activity", icon: Bell, onClick: () => navigate("/owner/notifications"), accent: "slate" },
  ];

  const featureStudioItems = [
    {
      title: "Expense Intelligence",
      subtitle: "Control spending by property and protect rental margins.",
      statLabel: "Paid Collection",
      statValue: formatCurrency(paidRent),
      icon: Receipt,
      accent: "from-blue-500 to-cyan-500",
      border: "border-blue-100",
      bg: "from-blue-50 to-cyan-50",
      onClick: () => navigate("/owner/expenses"),
    },
    {
      title: "Analytics & Tax Reports",
      subtitle: "Track monthly performance and prepare ITR-ready insights.",
      statLabel: "Overdue Exposure",
      statValue: formatCurrency(overdueRent),
      icon: BarChart2,
      accent: "from-violet-500 to-purple-500",
      border: "border-violet-100",
      bg: "from-violet-50 to-purple-50",
      onClick: () => navigate("/owner/analytics"),
    },
    {
      title: "Digital Agreements",
      subtitle: "Generate and download rent agreement PDFs from leases.",
      statLabel: "Active Leases",
      statValue: `${activeLeases}`,
      icon: FileText,
      accent: "from-emerald-500 to-teal-500",
      border: "border-emerald-100",
      bg: "from-emerald-50 to-teal-50",
      onClick: () => navigate("/owner/tenants"),
    },
    {
      title: "Tenant Reviews",
      subtitle: "See what tenants liked and where experience can improve.",
      statLabel: "New Inquiries",
      statValue: `${newInquiries}`,
      icon: Star,
      accent: "from-amber-500 to-orange-500",
      border: "border-amber-100",
      bg: "from-amber-50 to-orange-50",
      onClick: () => navigate("/owner/reviews"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_44%,_#f9fafb_100%)] pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,rgba(2,132,199,0.08),rgba(255,255,255,0))]" />
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-white/90 px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:py-8">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-16 h-28 w-28 rounded-full bg-amber-100/70 blur-2xl" />
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
                <Rocket size={12} /> Owner Command Center
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-[2.6rem]">
                Run your portfolio like a premium asset business, not a spreadsheet.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Welcome back {ownerDisplayName}. This dashboard is now optimized for visibility, faster decision making, and stronger owner confidence across leasing, rent, and operations.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700">Portfolio Health</p>
                  <p className="mt-1 text-sm font-bold text-sky-950">{portfolioHealthTone}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Occupancy</p>
                  <p className="mt-1 text-sm font-bold text-emerald-950">{occupancyRate.toFixed(0)}% occupied</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Leasing Pressure</p>
                  <p className="mt-1 text-sm font-bold text-amber-950">{vacantProperties} vacant {vacantProperties === 1 ? "unit" : "units"}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-700">Attention Queue</p>
                  <p className="mt-1 text-sm font-bold text-rose-950">{attentionCount} priority item{attentionCount === 1 ? "" : "s"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-300">Focus Today</p>
                  <p className="mt-1 text-lg font-bold text-white">What needs owner attention first</p>
                </div>
                <BellRing size={18} className="text-amber-300" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">New Leads</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{newInquiries}</p>
                  <p className="text-xs text-slate-300">Fresh prospects waiting for outreach.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Open Maintenance</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{openMaintenanceRequests}</p>
                  <p className="text-xs text-slate-300">Operational issues still active in the queue.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Revenue at Risk</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{formatCurrency(overdueRent)}</p>
                  <p className="text-xs text-slate-300">Overdue rent needing follow-up right now.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <MetricCard title="Total Properties" value={stats?.totalProperties || 0} subtitle="Portfolio-wide inventory" icon={Building2} accent="blue" onClick={() => navigate("/owner/properties")} />
            <MetricCard title="Active Leases" value={stats?.activeLeases || 0} subtitle="Current tenant occupancy" icon={Users} accent="green" onClick={() => navigate("/owner/tenants")} />
            <MetricCard title="Pending Rent" value={formatCurrency(pendingRent)} subtitle="Collection still outstanding" icon={Wallet} accent="amber" onClick={() => navigate("/owner/rent")} />
            <MetricCard title="Active Leads" value={activeLeadCount} subtitle="Prospects still moving through pipeline" icon={MessageCircle} accent="rose" onClick={() => navigate("/owner/inquiries")} />
          </div>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sectionTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSectionTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSectionTab(tab.id)}
                  className={`group rounded-3xl border px-4 py-4 text-left transition-all duration-300 ${
                    active
                      ? `${tab.activeClass} ring-1 ring-inset ring-current/20`
                      : `border-slate-200 bg-white text-gray-700 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.10)] ${tab.idleClass}`
                  }`}
                  aria-pressed={active}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 rounded-2xl border p-2.5 transition-transform duration-300 ${active ? `${tab.iconClass} scale-105` : "border-slate-200 bg-slate-50 text-gray-500 group-hover:scale-110 group-hover:-rotate-3"}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1">
                      <p className="text-sm font-bold">{tab.label}</p>
                      <p className={`mt-1 text-[11px] ${active ? tab.helperClass : "text-gray-500"}`}>{tab.helper}</p>

                      <span className="mt-2 inline-flex items-center gap-1.5">
                        {active ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-current/20 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            Active section
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 transition-all group-hover:border-slate-300 group-hover:bg-slate-100">
                            Click to open
                            <ArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        )}
                      </span>
                    </span>

                    {!active ? (
                      <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse-soft" aria-hidden="true" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="rounded-[30px] border border-white/70 bg-white/45 p-1 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
          <div className="space-y-6 rounded-[26px] bg-transparent p-3 sm:p-4">
            {activeSectionTab === "overview" && (
              <>
                <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-900"><Sparkles size={18} className="text-indigo-600" /> Feature Studio</h3>
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">New capabilities</span>
                  </div>
                  <p className="mb-5 text-sm text-gray-600">Access your newest tools in one place to improve profitability, reporting, tenant experience, and operational speed.</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {featureStudioItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          type="button"
                          onClick={item.onClick}
                          className={`group rounded-3xl border ${item.border} bg-gradient-to-br ${item.bg} p-4 text-left transition-all hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)]`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{item.title}</p>
                              <p className="mt-1 text-xs leading-5 text-gray-600">{item.subtitle}</p>
                            </div>
                            <span className={`shrink-0 rounded-2xl bg-gradient-to-br ${item.accent} p-2.5 text-white shadow-md`}>
                              <Icon size={16} />
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{item.statLabel}</p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">{item.statValue}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                              Open <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-900"><TrendingUp size={18} className="text-emerald-600" /> Portfolio Health</h3>
                      <button type="button" onClick={() => navigate("/owner/properties")} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open Portfolio</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">Occupancy Rate</p>
                        <p className="mt-3 text-4xl font-extrabold text-sky-950">{occupancyRate.toFixed(0)}%</p>
                        <p className="mt-2 text-xs font-medium text-sky-700">{occupiedProperties} occupied out of {totalProperties} properties</p>
                      </div>
                      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Vacancy Exposure</p>
                        <p className="mt-3 text-4xl font-extrabold text-amber-950">{vacancyRate.toFixed(0)}%</p>
                        <p className="mt-2 text-xs font-medium text-amber-700">{vacantProperties} units ready for leasing</p>
                      </div>
                      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Collection Snapshot</p>
                        <p className="mt-3 text-4xl font-extrabold text-emerald-950">{formatCurrency(paidRent)}</p>
                        <p className="mt-2 text-xs font-medium text-emerald-700">Paid amount received across active rent cycles</p>
                      </div>
                      <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700">Open Issues</p>
                        <p className="mt-3 text-4xl font-extrabold text-rose-950">{openMaintenanceRequests}</p>
                        <p className="mt-2 text-xs font-medium text-rose-700">Maintenance requests still requiring action</p>
                      </div>
                      <button type="button" onClick={() => navigate("/owner/expenses")} className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left hover:-translate-y-0.5 transition-all">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">Expense Tracker</p>
                        <p className="mt-3 text-sm font-bold text-blue-800">Track property expenses & net income</p>
                        <p className="mt-2 text-xs font-medium text-blue-600">Go to Expense Tracker →</p>
                      </button>
                      <button type="button" onClick={() => navigate("/owner/analytics")} className="rounded-3xl border border-purple-100 bg-purple-50 p-5 text-left hover:-translate-y-0.5 transition-all">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-700">Tax Report</p>
                        <p className="mt-3 text-sm font-bold text-purple-800">Annual income statement & ITR PDF</p>
                        <p className="mt-2 text-xs font-medium text-purple-600">Go to Analytics →</p>
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-white"><ClipboardList size={18} className="text-cyan-300" /> Summary At A Glance</h3>
                    <div className="mt-4 space-y-3">
                      <button type="button" onClick={() => navigate("/owner/inquiries")} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Total Inquiries</p>
                        <p className="mt-1 text-lg font-bold text-white">{totalInquiries}</p>
                        <p className="text-xs text-slate-300">{newInquiries} are still new and waiting for outreach</p>
                      </button>
                      <button type="button" onClick={() => navigate("/owner/tenants")} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Lease Activity</p>
                        <p className="mt-1 text-lg font-bold text-white">{activeLeases} active lease{activeLeases === 1 ? "" : "s"}</p>
                        <p className="text-xs text-slate-300">Use Tenants & Leases to review renewals and move-outs</p>
                      </button>
                      <button type="button" onClick={() => navigate("/owner/maintenance")} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">Immediate Focus</p>
                        <p className="mt-1 text-lg font-bold text-white">{attentionCount}</p>
                        <p className="text-xs text-slate-300">Tasks from maintenance, lead follow-up, and overdue rent</p>
                      </button>
                    </div>
                  </section>
                </div>

                <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-900"><Home size={18} className="text-blue-600" /> Quick Navigation</h3>
                    <p className="text-xs font-medium text-gray-500">Jump directly into any owner workflow</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {quickNavItems.map((item) => (
                      <QuickNavCard key={item.title} {...item} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeSectionTab === "leads" && (
              <>
                <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><MessageCircle size={18} className="text-blue-600" /> Recent Property Inquiries</h3>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{stats?.totalInquiries || 0} total</span>
                  </div>

                  {recentInquiries.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">No inquiries received yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {recentInquiries.map((inquiry) => (
                        <div key={inquiry._id} className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm">
                          <p className="text-sm font-semibold text-gray-900">{inquiry.property?.propertyType || "Property"} - {inquiry.property?.address?.city || "N/A"}</p>
                          <p className="mt-1 text-xs text-gray-600">Inquirer: {inquiry.inquirer?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.inquirer?.phone || "N/A"}</p>
                          <div className="mt-3">
                            <select
                              value={inquiry.status || "New"}
                              onChange={(e) => updateInquiryStatus(inquiry._id, e.target.value)}
                              disabled={updatingInquiryId === inquiry._id}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700"
                            >
                              <option value="New">New</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="New Leads" value={inquiryTotals.new} subtitle="Need first response" icon={Mail} accent="amber" onClick={() => navigate("/owner/inquiries")} />
                  <MetricCard title="In Progress" value={inquiryTotals.inProgress} subtitle="Active negotiation" icon={Clock3} accent="blue" onClick={() => navigate("/owner/inquiries")} />
                  <MetricCard title="Contacted" value={inquiryTotals.contacted} subtitle="Conversation started" icon={MessageCircle} accent="green" onClick={() => navigate("/owner/inquiries")} />
                  <MetricCard title="Closed" value={inquiryTotals.closed} subtitle="Lead cycle complete" icon={TrendingUp} accent="rose" onClick={() => navigate("/owner/inquiries")} />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-900"><Rocket size={18} className="text-emerald-600" /> Lead Action Center</h3>
                      <button type="button" onClick={() => navigate("/owner/inquiries")} className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Open Inquiry Page</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickNavCard title="Respond to New Leads" subtitle={`${inquiryTotals.new} prospects are waiting for the first response`} icon={Mail} onClick={() => navigate("/owner/inquiries")} accent="amber" />
                      <QuickNavCard title="Follow Up Active Leads" subtitle={`${inquiryTotals.inProgress} conversations are currently in progress`} icon={Clock3} onClick={() => navigate("/owner/inquiries")} accent="blue" />
                      <QuickNavCard title="Promote Vacancies" subtitle="Use vacant properties to generate more inbound demand" icon={MapPin} onClick={() => navigate("/owner/vacancies")} accent="violet" />
                      <QuickNavCard title="Refresh Listings" subtitle="Improve conversion by updating property information" icon={Building2} onClick={() => navigate("/owner/properties")} accent="green" />
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-white"><TrendingUp size={18} className="text-indigo-300" /> Lead Funnel Summary</h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Top Priority</p>
                        <p className="mt-1 text-lg font-bold text-white">{inquiryTotals.new} New Lead{inquiryTotals.new === 1 ? "" : "s"}</p>
                        <p className="text-xs text-amber-100">These should be handled first for better conversion speed.</p>
                      </div>
                      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">Warm Pipeline</p>
                        <p className="mt-1 text-lg font-bold text-white">{inquiryTotals.inProgress} Active Follow-up{inquiryTotals.inProgress === 1 ? "" : "s"}</p>
                        <p className="text-xs text-sky-100">Keep momentum with quick status updates and callbacks.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Relationship Progress</p>
                        <p className="mt-1 text-lg font-bold text-white">{inquiryTotals.contacted + inquiryTotals.closed} advanced lead{inquiryTotals.contacted + inquiryTotals.closed === 1 ? "" : "s"}</p>
                        <p className="text-xs text-emerald-100">Contacts already engaged or fully closed.</p>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}

            {activeSectionTab === "operations" && (
              <>
                <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><BellRing size={18} className="text-blue-600" /> Smart Alerts</h3>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{alerts.length} active</span>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">No critical alerts right now.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-2xl p-2.5 ${
                                alert.id === "overdue"
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {alert.id === "overdue" ? <Wallet size={18} /> : <Wrench size={18} />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                              <p className="mt-1 text-xs text-gray-600">{alert.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Rocket size={18} className="text-indigo-600" /> Quick Execution Actions</h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button onClick={() => navigate("/owner/properties")} className="rounded-3xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-left transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-blue-100 p-2.5 text-blue-700"><Building2 size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Properties</p>
                          <p className="mt-1 text-xs text-gray-600">Review listings, availability, and unit details.</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => navigate("/owner/rent")} className="rounded-3xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-left transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700"><Wallet size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Rent Management</p>
                          <p className="mt-1 text-xs text-gray-600">Handle pending, paid, and overdue rent items.</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => navigate("/owner/maintenance")} className="rounded-3xl border border-rose-100 bg-rose-50/80 px-4 py-4 text-left transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-rose-100 p-2.5 text-rose-700"><Wrench size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Maintenance</p>
                          <p className="mt-1 text-xs text-gray-600">Track urgent work orders and service progress.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="inline-flex items-center gap-2 text-base font-bold text-gray-900"><ShieldCheck size={18} className="text-emerald-600" /> Operations Navigator</h3>
                      <p className="text-xs font-medium text-gray-500">All key execution areas in one place</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickNavCard title="Tenants & Leases" subtitle="Review active agreements and tenant records" icon={Users} onClick={() => navigate("/owner/tenants")} accent="blue" />
                      <QuickNavCard title="Lease Renewals" subtitle="Manage lease continuation and rent revision" icon={RefreshCcw} onClick={() => navigate("/owner/renewals")} accent="violet" />
                      <QuickNavCard title="Move-Out Requests" subtitle="Track exits, approvals, and closure flow" icon={DoorOpen} onClick={() => navigate("/owner/move-out")} accent="rose" />
                      <QuickNavCard title="Notifications" subtitle="Review latest system and activity updates" icon={Bell} onClick={() => navigate("/owner/notifications")} accent="slate" />
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-slate-900 bg-slate-950 p-6 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
                    <h3 className="inline-flex items-center gap-2 text-base font-bold text-white"><ClipboardList size={18} className="text-indigo-300" /> Operational Snapshot</h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-rose-400/15 p-2 text-rose-200"><Wrench size={16} /></div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-200">Maintenance Queue</p>
                            <p className="mt-1 text-lg font-bold text-white">{openMaintenanceRequests} open request{openMaintenanceRequests === 1 ? "" : "s"}</p>
                            <p className="text-xs text-rose-100">Visit Maintenance to clear operational bottlenecks.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-violet-400/15 p-2 text-violet-200"><MapPin size={16} /></div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">Leasing Availability</p>
                            <p className="mt-1 text-lg font-bold text-white">{vacantProperties} vacant propert{vacantProperties === 1 ? "y" : "ies"}</p>
                            <p className="text-xs text-violet-100">Use Vacancies and Inquiries together to improve fill rate.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-amber-400/15 p-2 text-amber-200"><Wallet size={16} /></div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Financial Pressure</p>
                            <p className="mt-1 text-lg font-bold text-white">{formatCurrency(pendingRent + overdueRent)}</p>
                            <p className="text-xs text-amber-100">Combine rent follow-up with tenant communication for faster resolution.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
