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
} from "lucide-react";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const MetricCard = ({ title, value, subtitle, icon: Icon, accent = "blue" }) => {
  const accentMap = {
    blue: "from-blue-500 to-indigo-500",
    green: "from-emerald-500 to-green-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-red-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2.5 text-white shadow-lg ${accentMap[accent] || accentMap.blue}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
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
      className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl border p-2.5 ${accentMap[accent] || accentMap.blue}`}>
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
    { id: "overview", label: "Portfolio Overview", icon: Home, helper: "KPIs and financial snapshot" },
    { id: "leads", label: "Leads & Growth", icon: MessageCircle, helper: "Inquiries and conversion flow" },
    { id: "operations", label: "Operations", icon: ClipboardList, helper: "Alerts and execution focus" },
  ];

  const quickNavItems = [
    { title: "Properties", subtitle: "Manage listings, unit details, and availability", icon: Building2, onClick: () => navigate("/owner/properties"), accent: "blue" },
    { title: "Tenants & Leases", subtitle: "Review active leases and tenant lifecycle", icon: Users, onClick: () => navigate("/owner/tenants"), accent: "green" },
    { title: "Rent Management", subtitle: "Track pending, paid, and overdue rent cycles", icon: Wallet, onClick: () => navigate("/owner/rent"), accent: "amber" },
    { title: "Vacancies", subtitle: "Promote vacant inventory and fill empty units", icon: MapPin, onClick: () => navigate("/owner/vacancies"), accent: "violet" },
    { title: "Maintenance", subtitle: "Handle service requests and urgent issues", icon: Wrench, onClick: () => navigate("/owner/maintenance"), accent: "rose" },
    { title: "Notifications", subtitle: "Check recent updates and platform activity", icon: Bell, onClick: () => navigate("/owner/notifications"), accent: "slate" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-150 pb-8">
      <div className="relative z-10 space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <section className="rounded-[28px] border border-blue-100 bg-white/90 px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Owner Dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.2rem]">Welcome Back {ownerDisplayName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">A simple overview of your portfolio, leads, and operations in one place.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                {totalProperties} Properties
              </div>
              <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {occupiedProperties} Occupied
              </div>
              <div className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                {newInquiries} New Leads
              </div>
              <div className="rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                {openMaintenanceRequests} Open Requests
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {sectionTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeSectionTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSectionTab(tab.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-indigo-200 bg-white text-indigo-700 shadow-[0_8px_24px_rgba(99,102,241,0.12)]"
                        : "border-transparent bg-slate-50 text-gray-700 hover:border-slate-200 hover:bg-white"
                    }`}
                    aria-pressed={active}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 rounded-xl p-2 ${active ? "bg-indigo-100 text-indigo-700" : "bg-white text-gray-500 border border-slate-200"}`}>
                        <Icon size={16} />
                      </span>
                      <span>
                        <p className="text-sm font-semibold">{tab.label}</p>
                        <p className={`mt-1 text-[11px] ${active ? "text-indigo-500" : "text-gray-500"}`}>{tab.helper}</p>
                      </span>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </section>

          <div className="rounded-3xl border border-gray-100 bg-white/30 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="space-y-6 rounded-[22px] bg-transparent p-3 sm:p-4">
            {activeSectionTab === "overview" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Total Properties" value={stats?.totalProperties || 0} subtitle="Across all locations" icon={Building2} accent="blue" />
                  <MetricCard title="Active Leases" value={stats?.activeLeases || 0} subtitle="Tenant agreements running" icon={Users} accent="green" />
                  <MetricCard title="Pending Rent" value={formatCurrency(pendingRent)} subtitle="Awaiting payment" icon={Wallet} accent="amber" />
                  <MetricCard title="Overdue Rent" value={formatCurrency(overdueRent)} subtitle="Needs immediate follow-up" icon={AlertTriangle} accent="rose" />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /> Portfolio Health</h3>
                      <button type="button" onClick={() => navigate("/owner/properties")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Open Portfolio</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Occupancy Rate</p>
                        <p className="mt-2 text-3xl font-extrabold text-blue-950">{occupancyRate.toFixed(0)}%</p>
                        <p className="mt-1 text-xs text-blue-700">{occupiedProperties} occupied out of {totalProperties} properties</p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Vacancy Exposure</p>
                        <p className="mt-2 text-3xl font-extrabold text-amber-950">{vacancyRate.toFixed(0)}%</p>
                        <p className="mt-1 text-xs text-amber-700">{vacantProperties} units ready for leasing</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Collection Snapshot</p>
                        <p className="mt-2 text-3xl font-extrabold text-emerald-950">{formatCurrency(paidRent)}</p>
                        <p className="mt-1 text-xs text-emerald-700">Paid amount received across active rent cycles</p>
                      </div>
                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Open Issues</p>
                        <p className="mt-2 text-3xl font-extrabold text-rose-950">{openMaintenanceRequests}</p>
                        <p className="mt-1 text-xs text-rose-700">Maintenance requests still requiring action</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><ClipboardList size={18} className="text-indigo-600" /> Summary At A Glance</h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs text-gray-500">Total Inquiries</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{totalInquiries}</p>
                        <p className="text-xs text-gray-500">{newInquiries} are still new and waiting for outreach</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs text-gray-500">Lease Activity</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{activeLeases} active lease{activeLeases === 1 ? "" : "s"}</p>
                        <p className="text-xs text-gray-500">Use Tenants & Leases to review renewals and move-outs</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-xs text-gray-500">Immediate Focus</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{openMaintenanceRequests + newInquiries + overdueRent}</p>
                        <p className="text-xs text-gray-500">Tasks from maintenance, lead follow-up, and overdue rent</p>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><Home size={18} className="text-blue-600" /> Quick Navigation</h3>
                    <p className="text-xs text-gray-500">Jump directly into any owner workflow</p>
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
                <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900"><MessageCircle size={18} className="text-blue-600" /> Recent Property Inquiries</h3>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">{stats?.totalInquiries || 0} total</span>
                  </div>

                  {recentInquiries.length === 0 ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">No inquiries received yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {recentInquiries.map((inquiry) => (
                        <div key={inquiry._id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-3.5">
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
                  <MetricCard title="New Leads" value={inquiryTotals.new} subtitle="Need first response" icon={Mail} accent="amber" />
                  <MetricCard title="In Progress" value={inquiryTotals.inProgress} subtitle="Active negotiation" icon={Clock3} accent="blue" />
                  <MetricCard title="Contacted" value={inquiryTotals.contacted} subtitle="Conversation started" icon={MessageCircle} accent="green" />
                  <MetricCard title="Closed" value={inquiryTotals.closed} subtitle="Lead cycle complete" icon={TrendingUp} accent="rose" />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><Rocket size={18} className="text-emerald-600" /> Lead Action Center</h3>
                      <button type="button" onClick={() => navigate("/owner/inquiries")} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">Open Inquiry Page</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickNavCard title="Respond to New Leads" subtitle={`${inquiryTotals.new} prospects are waiting for the first response`} icon={Mail} onClick={() => navigate("/owner/inquiries")} accent="amber" />
                      <QuickNavCard title="Follow Up Active Leads" subtitle={`${inquiryTotals.inProgress} conversations are currently in progress`} icon={Clock3} onClick={() => navigate("/owner/inquiries")} accent="blue" />
                      <QuickNavCard title="Promote Vacancies" subtitle="Use vacant properties to generate more inbound demand" icon={MapPin} onClick={() => navigate("/owner/vacancies")} accent="violet" />
                      <QuickNavCard title="Refresh Listings" subtitle="Improve conversion by updating property information" icon={Building2} onClick={() => navigate("/owner/properties")} accent="green" />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><TrendingUp size={18} className="text-indigo-600" /> Lead Funnel Summary</h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Top Priority</p>
                        <p className="mt-1 text-lg font-bold text-amber-950">{inquiryTotals.new} New Lead{inquiryTotals.new === 1 ? "" : "s"}</p>
                        <p className="text-xs text-amber-700">These should be handled first for better conversion speed.</p>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Warm Pipeline</p>
                        <p className="mt-1 text-lg font-bold text-blue-950">{inquiryTotals.inProgress} Active Follow-up{inquiryTotals.inProgress === 1 ? "" : "s"}</p>
                        <p className="text-xs text-blue-700">Keep momentum with quick status updates and callbacks.</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Relationship Progress</p>
                        <p className="mt-1 text-lg font-bold text-emerald-950">{inquiryTotals.contacted + inquiryTotals.closed} advanced lead{inquiryTotals.contacted + inquiryTotals.closed === 1 ? "" : "s"}</p>
                        <p className="text-xs text-emerald-700">Contacts already engaged or fully closed.</p>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}

            {activeSectionTab === "operations" && (
              <>
                <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900"><BellRing size={18} className="text-blue-600" /> Smart Alerts</h3>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{alerts.length} active</span>
                  </div>

                  {alerts.length === 0 ? (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">No critical alerts right now.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-xl p-2.5 ${
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

                <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900"><Rocket size={18} className="text-indigo-600" /> Quick Execution Actions</h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button onClick={() => navigate("/owner/properties")} className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><Building2 size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Properties</p>
                          <p className="mt-1 text-xs text-gray-600">Review listings, availability, and unit details.</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => navigate("/owner/rent")} className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700"><Wallet size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Rent Management</p>
                          <p className="mt-1 text-xs text-gray-600">Handle pending, paid, and overdue rent items.</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => navigate("/owner/maintenance")} className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700"><Wrench size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Open Maintenance</p>
                          <p className="mt-1 text-xs text-gray-600">Track urgent work orders and service progress.</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> Operations Navigator</h3>
                      <p className="text-xs text-gray-500">All key execution areas in one place</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <QuickNavCard title="Tenants & Leases" subtitle="Review active agreements and tenant records" icon={Users} onClick={() => navigate("/owner/tenants")} accent="blue" />
                      <QuickNavCard title="Lease Renewals" subtitle="Manage lease continuation and rent revision" icon={RefreshCcw} onClick={() => navigate("/owner/renewals")} accent="violet" />
                      <QuickNavCard title="Move-Out Requests" subtitle="Track exits, approvals, and closure flow" icon={DoorOpen} onClick={() => navigate("/owner/move-out")} accent="rose" />
                      <QuickNavCard title="Notifications" subtitle="Review latest system and activity updates" icon={Bell} onClick={() => navigate("/owner/notifications")} accent="slate" />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2"><ClipboardList size={18} className="text-indigo-600" /> Operational Snapshot</h3>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-rose-100 p-2 text-rose-700"><Wrench size={16} /></div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Maintenance Queue</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{openMaintenanceRequests} open request{openMaintenanceRequests === 1 ? "" : "s"}</p>
                            <p className="text-xs text-gray-600">Visit Maintenance to clear operational bottlenecks.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-violet-100 p-2 text-violet-700"><MapPin size={16} /></div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Leasing Availability</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{vacantProperties} vacant propert{vacantProperties === 1 ? "y" : "ies"}</p>
                            <p className="text-xs text-gray-600">Use Vacancies and Inquiries together to improve fill rate.</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-amber-100 p-2 text-amber-700"><Wallet size={16} /></div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Financial Pressure</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{pendingRent + overdueRent} rent item{pendingRent + overdueRent === 1 ? "" : "s"} need attention</p>
                            <p className="text-xs text-gray-600">Combine rent follow-up with tenant communication for faster resolution.</p>
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
    </div>
  );
};

export default OwnerDashboard;
