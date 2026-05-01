import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  UserX,
  Users,
  Search,
  AlertTriangle,
  Home,
  Wallet,
  CalendarClock,
  Building2,
  Mail,
  Phone,
  MapPin,
  DoorOpen,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  ShieldCheck,
  RefreshCcw,
  Download,
} from "lucide-react";
import { PageHeader, Modal, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const TenantsLeases = () => {
  const DOC_TYPES = ["Rent Agreement", "Aadhaar Card", "PAN Card", "Police Verification", "Other"];
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };
  const shiftDaysInput = (value, days) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const [leases, setLeases] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sectionView, setSectionView] = useState("leases");
  const [leaseStatusFilter, setLeaseStatusFilter] = useState("All");
  const [leaseTypeFilter, setLeaseTypeFilter] = useState("All");
  const [leaseCityFilter, setLeaseCityFilter] = useState("All");
  const [moveOutStatusFilter, setMoveOutStatusFilter] = useState("All");
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [decisionModal, setDecisionModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [completionModal, setCompletionModal] = useState(false);
  const [completionRequest, setCompletionRequest] = useState(null);
  const [uploadDocsModal, setUploadDocsModal] = useState(false);
  const [viewDocsModal, setViewDocsModal] = useState(false);
  const [selectedLeaseForDocs, setSelectedLeaseForDocs] = useState(null);
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [renewals, setRenewals] = useState([]);
  const [renewalModal, setRenewalModal] = useState(false);
  const [renewalLease, setRenewalLease] = useState(null);
  const [terminateModal, setTerminateModal] = useState(false);
  const [terminateLeaseTarget, setTerminateLeaseTarget] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    status: "Approved",
    approvedLastStayingDate: "",
    closingFormalities: "",
    ownerNote: "",
  });
  const [completionForm, setCompletionForm] = useState({
    completionNote: "Tenant handed over keys, property inspected, and move-out formalities completed.",
    unpaidRentAmount: "0",
    maintenanceDeduction: "0",
    otherDeduction: "0",
    settlementNote: "",
  });
  const [docForm, setDocForm] = useState({
    documentType: "Rent Agreement",
    documentNumber: "",
    notes: "",
    document: null,
  });

  const [assignForm, setAssignForm] = useState({
    propertyId: "",
    tenantId: "",
    leaseStartDate: "",
    leaseEndDate: "",
    rentAmount: "",
    securityDeposit: "",
    rentDueDay: "1",
    graceDays: "0",
    lateFeeType: "fixed",
    lateFeeValue: "0",
  });

  const [editForm, setEditForm] = useState({});

  const fetchAll = async () => {
    try {
      const [leasesRes, tenantsRes, propsRes, moveOutRes, renewalRes] = await Promise.all([
        api.get("/owner/leases"),
        api.get("/owner/tenant-users"),
        api.get("/owner/properties"),
        api.get("/owner/move-out"),
        api.get("/owner/renewals"),
      ]);
      setLeases(leasesRes.data.leases);
      setTenantUsers(tenantsRes.data.tenants);
      setProperties(propsRes.data.properties);
      setMoveOutRequests(moveOutRes.data.requests || []);
      setRenewals(renewalRes.data.renewals || []);
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
      graceDays: lease.graceDays ?? 0,
      lateFeeType: lease.lateFeeType || "fixed",
      lateFeeValue: lease.lateFeeValue ?? 0,
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

  const openTerminateModal = (lease) => {
    setTerminateLeaseTarget(lease);
    setTerminateModal(true);
  };

  const terminateLease = async () => {
    if (!terminateLeaseTarget?._id) return;
    try {
      await api.patch(`/owner/leases/${terminateLeaseTarget._id}/terminate`);
      toast.success("Lease terminated.");
      setTerminateModal(false);
      setTerminateLeaseTarget(null);
      fetchAll();
    } catch {
      toast.error("Failed to terminate lease.");
    }
  };

  const downloadAgreement = async (leaseId) => {
    try {
      const response = await api.get(`/leases/${leaseId}/rent-agreement`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rent-agreement-${leaseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download agreement.");
    }
  };

  const totalMonthlyRent = leases.reduce((sum, l) => sum + Number(l.rentAmount || 0), 0);
  const expiringSoon = leases.filter((l) => {
    const end = new Date(l.leaseEndDate).getTime();
    const now = Date.now();
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return end >= now && end <= now + thirtyDays;
  }).length;

  const uniqueCities = new Set(
    leases.map((l) => l.property?.address?.city).filter(Boolean)
  ).size;

  const pendingMoveOutRequests = moveOutRequests.filter((r) => r.status === "Pending").length;
  const propertyTypeOptions = ["All", ...new Set(leases.map((l) => l.property?.propertyType).filter(Boolean))];
  const cityOptions = ["All", ...new Set(leases.map((l) => l.property?.address?.city).filter(Boolean))];

  const isExpiringSoonLease = (lease) => {
    const end = new Date(lease.leaseEndDate).getTime();
    const now = Date.now();
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;
    return end >= now && end <= now + thirtyDays;
  };

  const isExpiredLease = (lease) => {
    const leaseEnd = new Date(lease.leaseEndDate);
    if (Number.isNaN(leaseEnd.getTime())) return false;
    const leaseEndDay = new Date(leaseEnd);
    leaseEndDay.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return leaseEndDay < today;
  };

  const expiredLeasesCount = leases.filter((lease) => isExpiredLease(lease)).length;

  const normalizedSearch = search.trim().toLowerCase();
  const latestRenewalByLeaseId = renewals.reduce((acc, renewal) => {
    const leaseId = renewal.lease?._id || renewal.lease;
    if (!leaseId) return acc;
    const existing = acc[leaseId];
    if (!existing || new Date(renewal.createdAt) > new Date(existing.createdAt)) {
      acc[leaseId] = renewal;
    }
    return acc;
  }, {});

  const filteredLeases = leases.filter((l) => {
    const matchesSearch = (() => {
      if (!normalizedSearch) return true;
      const haystack = [
        l.tenant?.name,
        l.tenant?.email,
        l.tenant?.phone,
        l.property?.propertyType,
        l.property?.address?.street,
        l.property?.address?.city,
        l.property?.address?.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    })();

    const matchesType = leaseTypeFilter === "All" || l.property?.propertyType === leaseTypeFilter;
    const matchesCity = leaseCityFilter === "All" || l.property?.address?.city === leaseCityFilter;
    const matchesLeaseStatus = (() => {
      if (leaseStatusFilter === "All") return true;
      if (leaseStatusFilter === "ExpiringSoon") return isExpiringSoonLease(l);
      if (leaseStatusFilter === "Expired") return isExpiredLease(l);
      if (leaseStatusFilter === "RenewalPending") return latestRenewalByLeaseId[l._id]?.status === "Pending";
      return true;
    })();

    return matchesSearch && matchesType && matchesCity && matchesLeaseStatus;
  }).sort((a, b) => new Date(a.leaseEndDate) - new Date(b.leaseEndDate));

  const filteredMoveOutRequests = moveOutRequests.filter((request) => {
    if (moveOutStatusFilter === "All") return true;
    return request.status === moveOutStatusFilter;
  });

  const leaseFilterCounts = {
    all: leases.length,
    expiringSoon: leases.filter((l) => isExpiringSoonLease(l)).length,
    expired: leases.filter((l) => isExpiredLease(l)).length,
    renewalPending: leases.filter((l) => latestRenewalByLeaseId[l._id]?.status === "Pending").length,
  };

  const openDecisionModal = (request) => {
    setActiveRequest(request);
    setDecisionForm({
      status: "Approved",
      approvedLastStayingDate: request.requestedMoveOutDate?.slice(0, 10) || "",
      closingFormalities: "Collect keys, verify pending dues, inspect damages, and process security deposit settlement.",
      ownerNote: "",
    });
    setDecisionModal(true);
  };

  const submitDecision = async (e) => {
    e.preventDefault();
    if (!activeRequest?._id) return;
    setSaving(true);
    try {
      await api.patch(`/owner/move-out/${activeRequest._id}/decision`, decisionForm);
      toast.success("Move-out request updated.");
      setDecisionModal(false);
      setActiveRequest(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update move-out request.");
    } finally {
      setSaving(false);
    }
  };

  const loadComplianceDocs = async (leaseId) => {
    setDocsLoading(true);
    try {
      const { data } = await api.get(`/owner/compliance-documents?leaseId=${leaseId}`);
      setComplianceDocs(data.documents || []);
    } catch {
      toast.error("Failed to load compliance documents.");
    } finally {
      setDocsLoading(false);
    }
  };

  const openUploadDocsModal = (lease) => {
    setSelectedLeaseForDocs(lease);
    setUploadDocsModal(true);
    setDocForm({
      documentType: "Rent Agreement",
      documentNumber: "",
      notes: "",
      document: null,
    });
  };

  const openViewDocsModal = async (lease) => {
    setSelectedLeaseForDocs(lease);
    setViewDocsModal(true);
    await loadComplianceDocs(lease._id);
  };

  const uploadOwnerDoc = async (e) => {
    e.preventDefault();
    if (!selectedLeaseForDocs?._id) return;
    if (!docForm.document) {
      toast.error("Please select a document file.");
      return;
    }

    const payload = new FormData();
    payload.append("leaseId", selectedLeaseForDocs._id);
    payload.append("documentType", docForm.documentType);
    payload.append("documentNumber", docForm.documentNumber);
    payload.append("notes", docForm.notes);
    payload.append("document", docForm.document);

    setSaving(true);
    try {
      await api.post("/owner/compliance-documents", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Compliance document uploaded.");
      setDocForm({
        documentType: "Rent Agreement",
        documentNumber: "",
        notes: "",
        document: null,
      });
      setUploadDocsModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const openCompletionModal = (request) => {
    setCompletionRequest(request);
    setCompletionForm({
      completionNote: "Tenant handed over keys, property inspected, and move-out formalities completed.",
      unpaidRentAmount: String(request.outstandingDueAmount || 0),
      maintenanceDeduction: "0",
      otherDeduction: "0",
      settlementNote: "",
    });
    setCompletionModal(true);
  };

  const completeMoveOut = async (e) => {
    e.preventDefault();
    if (!completionRequest?._id) {
      toast.error("Invalid move-out request.");
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/owner/move-out/${completionRequest._id}/complete`, {
        completionNote: completionForm.completionNote,
        unpaidRentAmount: completionForm.unpaidRentAmount,
        maintenanceDeduction: completionForm.maintenanceDeduction,
        otherDeduction: completionForm.otherDeduction,
        settlementNote: completionForm.settlementNote,
      });
      toast.success("Move-out settlement recorded. Waiting for tenant acknowledgement.");
      setCompletionModal(false);
      setCompletionRequest(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete move-out.");
    } finally {
      setSaving(false);
    }
  };

  const openRenewalModal = (lease) => {
    setRenewalLease(lease);
    setRenewalModal(true);
  };

  const proposeRenewal = async (e) => {
    e.preventDefault();
    if (!renewalLease?._id) return;
    const form = e.currentTarget;
    const payload = {
      leaseId: renewalLease._id,
      proposedRentAmount: form.proposedRentAmount.value,
      proposedLeaseStartDate: form.proposedLeaseStartDate.value,
      proposedLeaseEndDate: form.proposedLeaseEndDate.value,
      note: form.note.value,
    };
    const currentEndDate = renewalLease.leaseEndDate ? new Date(renewalLease.leaseEndDate) : null;
    const proposedStartDate = new Date(payload.proposedLeaseStartDate);
    const proposedEndDate = new Date(payload.proposedLeaseEndDate);
    if (currentEndDate && proposedStartDate < currentEndDate) {
      toast.error("Renewal must start on or after the current lease end date.");
      return;
    }
    if (proposedEndDate <= proposedStartDate) {
      toast.error("Renewal end date must be after start date.");
      return;
    }
    try {
      setSaving(true);
      await api.post("/owner/renewals", payload);
      toast.success("Renewal proposal sent to tenant.");
      setRenewalModal(false);
      setRenewalLease(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send renewal.");
    } finally {
      setSaving(false);
    }
  };

  const cancelRenewal = async (id) => {
    try {
      await api.patch(`/owner/renewals/${id}/cancel`);
      toast.success("Renewal cancelled.");
      fetchAll();
    } catch {
      toast.error("Failed to cancel renewal.");
    }
  };

  const verifyDocument = async (docId, verificationStatus) => {
    try {
      await api.patch(`/owner/compliance-documents/${docId}/verify`, {
        verificationStatus,
      });
      toast.success(`Document ${verificationStatus.toLowerCase()}.`);
      if (selectedLeaseForDocs?._id && viewDocsModal) {
        await loadComplianceDocs(selectedLeaseForDocs._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants & Leases"
        subtitle="Manage tenant assignments, rent terms, and lease timelines"
        action={
          <button onClick={() => setAssignModal(true)} className="btn-primary flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Assign Tenant
          </button>
        }
      />

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 px-6 py-7 sm:px-8 shadow-xl">
        <div className="absolute -top-12 -right-8 h-28 w-28 rounded-full bg-indigo-400/25 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-200 font-semibold">Lease Center</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold">Track every tenant contract in one place</h2>
            <p className="mt-2 text-sm text-blue-100 max-w-xl">
              Keep assignment details, rent terms and lease dates organized with smart cards and fast actions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">Monthly Rent Volume</p>
            <p className="mt-2 text-3xl font-extrabold">{formatCurrency(totalMonthlyRent)}</p>
            <p className="mt-1 text-xs text-blue-200">Across {leases.length} active leases</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Leases</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">{leases.length}</p>
          <p className="text-xs text-gray-500 mt-1">Current contracts</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tenant Users</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700">{tenantUsers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Registered tenants</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Expiring in 30 Days</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-700">{expiringSoon}</p>
          <p className="text-xs text-gray-500 mt-1">Need renewal planning</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Move-Out Pending</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-700">{pendingMoveOutRequests}</p>
          <p className="text-xs text-gray-500 mt-1">Waiting for your decision</p>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSectionView("leases")}
            className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
              sectionView === "leases"
                ? "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-cyan-50 hover:text-cyan-700"
            }`}
          >
            Leases ({leases.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionView("moveOut")}
            className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
              sectionView === "moveOut"
                ? "border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-700"
            }`}
          >
            Move-Out Requests ({moveOutRequests.length})
          </button>
        </div>
      </section>

      {sectionView === "moveOut" ? (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 inline-flex items-center gap-2">
            <ClipboardCheck size={18} className="text-indigo-600" /> Tenant Move-Out Requests
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={moveOutStatusFilter}
              onChange={(e) => setMoveOutStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Acknowledgement Pending">Acknowledgement Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {filteredMoveOutRequests.length} shown
            </span>
          </div>
        </div>

        {filteredMoveOutRequests.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No move-out requests match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMoveOutRequests.slice(0, 8).map((request) => (
              <div key={request._id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 inline-flex items-center gap-1.5">
                        <DoorOpen size={15} className="text-indigo-600" /> {request.tenant?.name}
                      </p>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.property?.propertyType} - {request.property?.address?.street}, {request.property?.address?.city}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested move-out: {new Date(request.requestedMoveOutDate).toLocaleDateString()}
                    </p>
                    {request.reason ? <p className="text-sm text-gray-700">Reason: {request.reason}</p> : null}

                    {request.status === "Approved" ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        <p>Last staying day: {request.approvedLastStayingDate ? new Date(request.approvedLastStayingDate).toLocaleDateString() : "Not provided"}</p>
                        <p className="mt-1">Closing formalities: {request.closingFormalities || "Not provided"}</p>
                        {(request.outstandingDueCount || 0) > 0 ? (
                          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                            Completion blocked: {request.outstandingDueCount} pending/overdue rent record(s) worth {formatCurrency(request.outstandingDueAmount || 0)} must be cleared first.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {request.status === "Rejected" ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                        Reason shared: {request.ownerNote || "Not provided"}
                      </div>
                    ) : null}

                    {["Acknowledgement Pending", "Completed"].includes(request.status) ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        <p>
                          {request.status === "Acknowledgement Pending"
                            ? "Acknowledgement pending from tenant"
                            : `Completed on: ${request.completedAt ? new Date(request.completedAt).toLocaleDateString() : "Not available"}`}
                        </p>
                        <p className="mt-1">Completion note: {request.completionNote || "Not provided"}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    {request.status === "Pending" ? (
                      <button
                        type="button"
                        onClick={() => openDecisionModal(request)}
                        className="btn-primary py-1.5 px-3 text-sm"
                      >
                        Review Request
                      </button>
                    ) : null}

                    {request.status === "Approved" ? (
                      <button
                        type="button"
                        onClick={() => openCompletionModal(request)}
                        disabled={request.canComplete === false}
                        className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        title={request.canComplete === false ? "Clear all pending/overdue rent before completing move-out" : "Mark move-out completed"}
                      >
                        Mark Completed
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      ) : null}

      {sectionView === "leases" ? (
      <>
      {expiredLeasesCount > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-700">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Expired lease alert</p>
              <p className="mt-1 text-xs text-red-700">
                {expiredLeasesCount} lease(s) have already passed the lease end date. Review renewal status and terminate lease if renewal is not completed within 7 days after lease end.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Search */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <div className="h-full px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-500 flex items-center">
              <Search size={16} />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tenant, property, city or phone"
              className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white outline-none"
            />
          </div>
          <select
            value={leaseTypeFilter}
            onChange={(e) => setLeaseTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700"
          >
            {propertyTypeOptions.map((type) => (
              <option key={type} value={type}>{type === "All" ? "All Types" : type}</option>
            ))}
          </select>
          <select
            value={leaseCityFilter}
            onChange={(e) => setLeaseCityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700"
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city === "All" ? "All Cities" : city}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLeaseStatusFilter("All")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${leaseStatusFilter === "All" ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"}`}
          >
            All ({leaseFilterCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setLeaseStatusFilter("ExpiringSoon")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${leaseStatusFilter === "ExpiringSoon" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600"}`}
          >
            Expiring Soon ({leaseFilterCounts.expiringSoon})
          </button>
          <button
            type="button"
            onClick={() => setLeaseStatusFilter("Expired")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${leaseStatusFilter === "Expired" ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`}
          >
            Expired ({leaseFilterCounts.expired})
          </button>
          <button
            type="button"
            onClick={() => setLeaseStatusFilter("RenewalPending")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${leaseStatusFilter === "RenewalPending" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"}`}
          >
            Renewal Pending ({leaseFilterCounts.renewalPending})
          </button>
        </div>
      </div>

      {/* Lease Cards */}
      {filteredLeases.length === 0 ? (
        <EmptyState message="No active leases. Assign a tenant to get started." icon={Users} />
      ) : (
        <div className="space-y-4">
          {filteredLeases.map((l) => {
            const leaseEndDate = new Date(l.leaseEndDate);
            const leaseEndDay = new Date(leaseEndDate);
            leaseEndDay.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expired = leaseEndDay < today;
            const daysSinceExpiry = expired
              ? Math.max(1, Math.ceil((today.getTime() - leaseEndDay.getTime()) / (1000 * 60 * 60 * 24)))
              : 0;
            const graceDeadline = new Date(leaseEndDay);
            graceDeadline.setDate(graceDeadline.getDate() + 7);
            const isBeyondGrace = expired && today > graceDeadline;

            return (
            <div key={l._id} className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${expired ? "border-red-200" : "border-gray-100"}`}>
              {expired ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  <p className="font-semibold uppercase tracking-wider">Lease Expired</p>
                  <p className="mt-1">
                    Lease ended on {new Date(l.leaseEndDate).toLocaleDateString()} ({daysSinceExpiry} day(s) ago).
                  </p>
                  <p className="mt-1">
                    {isBeyondGrace
                      ? "Grace window exceeded. Take immediate action: finalize renewal or terminate this lease."
                      : `If renewal is not completed by ${graceDeadline.toLocaleDateString()}, terminate this lease.`}
                  </p>
                </div>
              ) : null}
              {latestRenewalByLeaseId[l._id] ? (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <p className="font-semibold uppercase tracking-wider">Renewal Timeline</p>
                  <p className="mt-1">Current: {formatCurrency(l.rentAmount)} | {new Date(l.leaseStartDate).toLocaleDateString()} - {new Date(l.leaseEndDate).toLocaleDateString()}</p>
                  <p className="mt-1 font-semibold">Next: {formatCurrency(latestRenewalByLeaseId[l._id].proposedRentAmount)} | {new Date(latestRenewalByLeaseId[l._id].proposedLeaseStartDate).toLocaleDateString()} - {new Date(latestRenewalByLeaseId[l._id].proposedLeaseEndDate).toLocaleDateString()} ({latestRenewalByLeaseId[l._id].status})</p>
                </div>
              ) : null}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg">{l.tenant?.name}</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-gray-400" /> {l.tenant?.email}</span>
                    <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-gray-400" /> {l.tenant?.phone || "No phone"}</span>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">
                    <p className="inline-flex items-center gap-1.5 font-medium text-gray-800">
                      <Building2 size={14} className="text-blue-600" />
                      {l.property?.propertyType}
                    </p>
                    <p className="mt-1 inline-flex items-start gap-1.5 text-gray-600">
                      <MapPin size={13} className="mt-0.5 text-gray-400" />
                      {l.property?.address?.street}, {l.property?.address?.city}, {l.property?.address?.state}
                    </p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 text-sm">
                      <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Rent</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(l.rentAmount)}/mo</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Deposit</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(l.securityDeposit || 0)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Due Day</p>
                      <p className="font-semibold text-gray-900">{l.rentDueDay}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Late Fee</p>
                      <p className="font-semibold text-gray-900">
                        {l.lateFeeType === "percent" ? `${Number(l.lateFeeValue || 0)}%` : formatCurrency(l.lateFeeValue || 0)}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">Grace: {Number(l.graceDays || 0)} day(s)</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Lease Start</p>
                      <p className="font-semibold text-gray-900">{new Date(l.leaseStartDate).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 px-3 py-2 bg-white">
                      <p className="text-xs text-gray-500">Lease End</p>
                      <p className="font-semibold text-gray-900 inline-flex items-center gap-1.5">
                        <CalendarClock size={13} className="text-amber-600" />
                        {new Date(l.leaseEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-row lg:flex-col">
                  <button onClick={() => openRenewalModal(l)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <RefreshCcw size={14} /> Renewal
                  </button>
                  <button onClick={() => openUploadDocsModal(l)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <Upload size={14} /> Upload Docs
                  </button>
                  <button onClick={() => openViewDocsModal(l)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <FileText size={14} /> View Docs
                  </button>
                  <button onClick={() => downloadAgreement(l._id)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <Download size={14} /> Agreement
                  </button>
                  <button onClick={() => openEditLease(l)} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => openTerminateModal(l)} className="btn-danger flex items-center gap-1.5 text-sm py-1.5 px-3">
                    <UserX size={14} /> Terminate
                  </button>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}
      </>
      ) : null}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
              <input type="date" value={assignForm.leaseStartDate} onChange={(e) => setAssignForm({ ...assignForm, leaseStartDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={assignForm.leaseEndDate} onChange={(e) => setAssignForm({ ...assignForm, leaseEndDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
              <input type="number" value={assignForm.rentAmount} onChange={(e) => setAssignForm({ ...assignForm, rentAmount: e.target.value })} required min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
              <input type="number" value={assignForm.securityDeposit} onChange={(e) => setAssignForm({ ...assignForm, securityDeposit: e.target.value })} min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
              <input type="number" value={assignForm.rentDueDay} onChange={(e) => setAssignForm({ ...assignForm, rentDueDay: e.target.value })} min={1} max={31} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
              <input type="number" value={assignForm.graceDays} onChange={(e) => setAssignForm({ ...assignForm, graceDays: e.target.value })} min={0} max={31} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Type</label>
              <select value={assignForm.lateFeeType} onChange={(e) => setAssignForm({ ...assignForm, lateFeeType: e.target.value })} className="input-field">
                <option value="fixed">Fixed Amount</option>
                <option value="percent">Percent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Value</label>
              <input type="number" value={assignForm.lateFeeValue} onChange={(e) => setAssignForm({ ...assignForm, lateFeeValue: e.target.value })} min={0} step="0.01" className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Assigning..." : "Assign"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={terminateModal} onClose={() => setTerminateModal(false)} title="Terminate Lease">
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-800">This action will end the active lease and mark the property as Vacant.</p>
            {terminateLeaseTarget ? (
              <div className="mt-2 text-xs text-rose-700 space-y-1">
                <p>Tenant: {terminateLeaseTarget.tenant?.name || "N/A"}</p>
                <p>
                  Property: {terminateLeaseTarget.property?.propertyType || "Property"} - {[
                    terminateLeaseTarget.property?.address?.street,
                    terminateLeaseTarget.property?.address?.city,
                    terminateLeaseTarget.property?.address?.state,
                    terminateLeaseTarget.property?.address?.pincode,
                  ].filter(Boolean).join(", ") || "Address not available"}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setTerminateModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={terminateLease}
              className="btn-danger inline-flex items-center gap-1.5"
            >
              <UserX size={14} /> Confirm Terminate
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Lease Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Lease">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start</label>
              <input type="date" value={editForm.leaseStartDate} onChange={(e) => setEditForm({ ...editForm, leaseStartDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease End</label>
              <input type="date" value={editForm.leaseEndDate} onChange={(e) => setEditForm({ ...editForm, leaseEndDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
              <input type="number" value={editForm.rentAmount} onChange={(e) => setEditForm({ ...editForm, rentAmount: e.target.value })} required min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit ($)</label>
              <input type="number" value={editForm.securityDeposit} onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })} min={0} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Due Day</label>
              <input type="number" value={editForm.rentDueDay} onChange={(e) => setEditForm({ ...editForm, rentDueDay: e.target.value })} min={1} max={31} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
              <input type="number" value={editForm.graceDays ?? 0} onChange={(e) => setEditForm({ ...editForm, graceDays: e.target.value })} min={0} max={31} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Type</label>
              <select value={editForm.lateFeeType || "fixed"} onChange={(e) => setEditForm({ ...editForm, lateFeeType: e.target.value })} className="input-field">
                <option value="fixed">Fixed Amount</option>
                <option value="percent">Percent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Value</label>
              <input type="number" value={editForm.lateFeeValue ?? 0} onChange={(e) => setEditForm({ ...editForm, lateFeeValue: e.target.value })} min={0} step="0.01" className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={decisionModal} onClose={() => setDecisionModal(false)} title="Review Move-Out Request">
        <form onSubmit={submitDecision} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
            <select
              value={decisionForm.status}
              onChange={(e) => setDecisionForm({ ...decisionForm, status: e.target.value })}
              className="input-field"
            >
              <option value="Approved">Approve</option>
              <option value="Rejected">Reject</option>
            </select>
          </div>

          {decisionForm.status === "Approved" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Staying Day</label>
                <input
                  type="date"
                  required
                  value={decisionForm.approvedLastStayingDate}
                  onChange={(e) => setDecisionForm({ ...decisionForm, approvedLastStayingDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Formalities</label>
                <textarea
                  rows={4}
                  required
                  value={decisionForm.closingFormalities}
                  onChange={(e) => setDecisionForm({ ...decisionForm, closingFormalities: e.target.value })}
                  className="input-field"
                  placeholder="Mention key handover, utility clearance, final inspection, dues settlement, etc."
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                required
                value={decisionForm.ownerNote}
                onChange={(e) => setDecisionForm({ ...decisionForm, ownerNote: e.target.value })}
                className="input-field"
                placeholder="Explain why request is rejected and what tenant should do next"
              />
            </div>
          )}

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Approved requests will be visible to tenant with last staying day and closing formalities.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDecisionModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-1.5">
              {decisionForm.status === "Approved" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {saving ? "Saving..." : "Submit Decision"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={completionModal} onClose={() => setCompletionModal(false)} title="Complete Move-Out">
        <form onSubmit={completeMoveOut} className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Final Confirmation</p>
            <p className="mt-1 text-sm text-emerald-800">
              This will close the active lease and mark this property as Vacant.
            </p>
            {completionRequest ? (
              <p className="mt-2 text-xs text-emerald-700">
                Tenant: {completionRequest.tenant?.name || "-"} | Property: {completionRequest.property?.propertyType || "-"}, {[
                  completionRequest.property?.address?.street,
                  completionRequest.property?.address?.city,
                  completionRequest.property?.address?.state,
                  completionRequest.property?.address?.pincode,
                ].filter(Boolean).join(", ") || "Address not available"}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completion Note</label>
            <textarea
              rows={4}
              value={completionForm.completionNote}
              onChange={(e) => setCompletionForm({ completionNote: e.target.value })}
              className="input-field"
              placeholder="Mention handover status, inspection, dues/deposit settlement, etc."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unpaid Rent</label>
              <input type="number" min={0} step="0.01" value={completionForm.unpaidRentAmount} onChange={(e) => setCompletionForm({ ...completionForm, unpaidRentAmount: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Deduction</label>
              <input type="number" min={0} step="0.01" value={completionForm.maintenanceDeduction} onChange={(e) => setCompletionForm({ ...completionForm, maintenanceDeduction: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction</label>
              <input type="number" min={0} step="0.01" value={completionForm.otherDeduction} onChange={(e) => setCompletionForm({ ...completionForm, otherDeduction: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Note</label>
              <input value={completionForm.settlementNote} onChange={(e) => setCompletionForm({ ...completionForm, settlementNote: e.target.value })} className="input-field" placeholder="Optional note" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCompletionModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Completing..." : "Confirm Completion"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={uploadDocsModal} onClose={() => setUploadDocsModal(false)} title="Upload Compliance Documents">
        <div className="space-y-4">
          {selectedLeaseForDocs ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              <p className="font-semibold">{selectedLeaseForDocs.tenant?.name}</p>
              <p className="text-xs mt-1">
                {selectedLeaseForDocs.property?.propertyType} - {selectedLeaseForDocs.property?.address?.street}, {selectedLeaseForDocs.property?.address?.city}
              </p>
            </div>
          ) : null}

          <form onSubmit={uploadOwnerDoc} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="input-field"
                >
                  {DOC_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                <input
                  value={docForm.documentNumber}
                  onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
                  className="input-field"
                  placeholder="Agreement no / Aadhaar no"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setDocForm({ ...docForm, document: e.target.files?.[0] || null })}
                className="input-field"
              />
              <p className="mt-1 text-xs text-gray-500">Allowed: PDF, JPG, PNG, WEBP (max 10MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={docForm.notes}
                onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                className="input-field"
                placeholder="Any compliance remarks"
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-1.5">
                <Upload size={14} /> {saving ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            Uploaded files can be reviewed and verified from the separate "View Docs" popup.
          </div>
        </div>
      </Modal>

      <Modal isOpen={viewDocsModal} onClose={() => setViewDocsModal(false)} title="Uploaded & Verified Documents">
        <div className="space-y-4">
          {selectedLeaseForDocs ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">
              <p className="font-semibold">{selectedLeaseForDocs.tenant?.name}</p>
              <p className="text-xs mt-1">
                {selectedLeaseForDocs.property?.propertyType} - {selectedLeaseForDocs.property?.address?.street}, {selectedLeaseForDocs.property?.address?.city}
              </p>
            </div>
          ) : null}

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> Uploaded Documents
            </p>

            {docsLoading ? (
              <p className="text-sm text-gray-500">Loading documents...</p>
            ) : complianceDocs.length === 0 ? (
              <p className="text-sm text-gray-500">No compliance documents uploaded yet.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2">
                {complianceDocs.map((doc) => (
                  <div key={doc._id} className="rounded-lg border border-gray-100 px-3 py-2">
                    <a
                      href={`${API_BASE}${doc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:bg-gray-50"
                    >
                    <p className="text-sm font-semibold text-gray-900">{doc.documentType}</p>
                    <p className="text-xs text-gray-600">
                      Uploaded by {doc.uploadedByRole} on {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.documentNumber ? <p className="text-xs text-gray-500">No: {doc.documentNumber}</p> : null}
                    </a>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600">Status: {doc.verificationStatus || "Pending"}</span>
                      {doc.verificationStatus !== "Verified" ? (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => verifyDocument(doc._id, "Verified")} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Verify</button>
                          <button type="button" onClick={() => verifyDocument(doc._id, "Rejected")} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">Reject</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={renewalModal} onClose={() => setRenewalModal(false)} title="Propose Lease Renewal">
        {renewalLease ? (
          <form onSubmit={proposeRenewal} className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <p className="font-semibold uppercase tracking-wider">Current Lease</p>
              <p className="mt-1">Rent: {formatCurrency(renewalLease.rentAmount)} | {new Date(renewalLease.leaseStartDate).toLocaleDateString()} - {new Date(renewalLease.leaseEndDate).toLocaleDateString()}</p>
              <p className="mt-1">Renewal should begin from current lease end for a clean tenant timeline.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {renewalLease.tenant?.name} - {renewalLease.property?.propertyType}, {renewalLease.property?.address?.city}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Rent</label>
              <input name="proposedRentAmount" type="number" min={0} step="0.01" defaultValue={renewalLease.rentAmount} className="input-field" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  name="proposedLeaseStartDate"
                  type="date"
                  className="input-field"
                  defaultValue={shiftDaysInput(renewalLease.leaseEndDate, 1) || toInputDate(renewalLease.leaseEndDate)}
                  min={toInputDate(renewalLease.leaseEndDate)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  name="proposedLeaseEndDate"
                  type="date"
                  className="input-field"
                  defaultValue={shiftDaysInput(renewalLease.leaseEndDate, 365)}
                  min={shiftDaysInput(renewalLease.leaseEndDate, 1) || toInputDate(renewalLease.leaseEndDate)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea name="note" rows={3} className="input-field" placeholder="Optional message for tenant" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRenewalModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Sending..." : "Send Proposal"}</button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
};

export default TenantsLeases;
