import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  History,
  FileText,
  Image,
  RotateCcw,
  Trash2,
  MapPin,
  MessageCircle,
  Users,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import { toAssetUrl } from "../../utils/propertyImages";

const tabs = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "tenants", label: "Tenant Details", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "applications", label: "Applications", icon: MessageCircle },
  { id: "photos", label: "Property Photos", icon: Image },
  { id: "tenantHistory", label: "Tenant History", icon: History },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "renewals", label: "Renewals", icon: RotateCcw },
];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const PropertyWorkspace = () => {
  const { propertyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leases, setLeases] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [rents, setRents] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [showAssignTenant, setShowAssignTenant] = useState(false);
  const [assigningTenant, setAssigningTenant] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [removingPhotoUrl, setRemovingPhotoUrl] = useState("");
  const [propertyPhotoFiles, setPropertyPhotoFiles] = useState([]);
  const [assignForm, setAssignForm] = useState({
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

  const [paymentUpdatingId, setPaymentUpdatingId] = useState("");
  const [maintenanceUpdatingId, setMaintenanceUpdatingId] = useState("");
  const [maintenanceNote, setMaintenanceNote] = useState({});
  const [inquiryUpdatingId, setInquiryUpdatingId] = useState("");
  const [docUpdatingId, setDocUpdatingId] = useState("");
  const [renewalSaving, setRenewalSaving] = useState(false);
  const [renewalCancellingId, setRenewalCancellingId] = useState("");
  const [showCreateRenewalForm, setShowCreateRenewalForm] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    leaseId: "",
    proposedRentAmount: "",
    proposedLeaseStartDate: "",
    proposedLeaseEndDate: "",
    note: "",
  });
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");

  const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          propertyRes,
          propertiesRes,
          leasesRes,
          rentsRes,
          maintenanceRes,
          inquiriesRes,
          moveOutRes,
          docsRes,
          renewalsRes,
          tenantsRes,
        ] = await Promise.all([
          api.get(`/owner/properties/${propertyId}`),
          api.get("/owner/properties"),
          api.get("/owner/leases?includeInactive=true"),
          api.get("/owner/rent"),
          api.get("/owner/maintenance"),
          api.get("/owner/inquiries"),
          api.get("/owner/move-out"),
          api.get("/owner/compliance-documents"),
          api.get("/owner/renewals"),
          api.get("/owner/tenant-users"),
        ]);

        const allLeases = leasesRes.data?.leases || [];
        const allRents = rentsRes.data?.rents || [];
        const allMaintenance = maintenanceRes.data?.requests || [];
        const allInquiries = inquiriesRes.data?.inquiries || [];
        const allMoveOut = moveOutRes.data?.requests || [];
        const allDocuments = docsRes.data?.documents || [];
        const allRenewals = renewalsRes.data?.renewals || [];
        const propertyLeases = allLeases.filter((item) => getId(item.property) === propertyId);
        const activeLease = propertyLeases.find((lease) => lease.isActive);

        setProperty(propertyRes.data?.property || null);
        setProperties(propertiesRes.data?.properties || []);
        setLeases(propertyLeases.filter((lease) => lease.isActive));
        setAllLeases(propertyLeases);
        setRents(allRents.filter((item) => getId(item.property) === propertyId));
        setMaintenanceRequests(allMaintenance.filter((item) => getId(item.property) === propertyId));
        setInquiries(allInquiries.filter((item) => getId(item.property) === propertyId));
        setMoveOutRequests(allMoveOut.filter((item) => getId(item.property) === propertyId));
        setDocuments(allDocuments.filter((item) => getId(item.property) === propertyId));
        setRenewals(allRenewals.filter((item) => getId(item.property) === propertyId));
        setTenantUsers(tenantsRes.data?.tenants || []);

        setRenewalForm((prev) => ({
          ...prev,
          leaseId: activeLease?._id || "",
          proposedRentAmount: activeLease ? String(activeLease.rentAmount || "") : "",
          proposedLeaseStartDate: activeLease ? toDateInput(activeLease.leaseEndDate) : "",
          proposedLeaseEndDate: prev.proposedLeaseEndDate || "",
        }));
      } catch {
        toast.error("Failed to load property workspace.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tab = query.get("tab");
    const openAssign = query.get("openAssign") === "1";
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
    if (openAssign) {
      setActiveTab("tenants");
      setShowAssignTenant(true);
    }
  }, [location.search]);

  const propertyLabel = useMemo(() => {
    if (!property) return "Property";
    const street = property.address?.street || "Untitled Property";
    const unitLabel = `${property.propertyType || "Unit"} ${property.numberOfRooms ? `(${property.numberOfRooms} rooms)` : ""}`.trim();
    return `${street} / ${unitLabel}`;
  }, [property]);

  const openRentCount = rents.filter((rent) => ["Pending", "Overdue"].includes(rent.status)).length;

  const refreshWorkspace = async () => {
    try {
      const [propertyRes, leasesRes, rentsRes, maintenanceRes, inquiriesRes, moveOutRes, docsRes, renewalsRes] = await Promise.all([
        api.get(`/owner/properties/${propertyId}`),
        api.get("/owner/leases?includeInactive=true"),
        api.get("/owner/rent"),
        api.get("/owner/maintenance"),
        api.get("/owner/inquiries"),
        api.get("/owner/move-out"),
        api.get("/owner/compliance-documents"),
        api.get("/owner/renewals"),
      ]);

      setProperty(propertyRes.data?.property || null);
      const nextLeases = (leasesRes.data?.leases || []).filter((item) => getId(item.property) === propertyId);
      setLeases(nextLeases.filter((lease) => lease.isActive));
      setAllLeases(nextLeases);
      setRents((rentsRes.data?.rents || []).filter((item) => getId(item.property) === propertyId));
      setMaintenanceRequests((maintenanceRes.data?.requests || []).filter((item) => getId(item.property) === propertyId));
      setInquiries((inquiriesRes.data?.inquiries || []).filter((item) => getId(item.property) === propertyId));
      setMoveOutRequests((moveOutRes.data?.requests || []).filter((item) => getId(item.property) === propertyId));
      setDocuments((docsRes.data?.documents || []).filter((item) => getId(item.property) === propertyId));
      setRenewals((renewalsRes.data?.renewals || []).filter((item) => getId(item.property) === propertyId));
    } catch {
      toast.error("Unable to refresh property workspace.");
    }
  };

  const uploadPropertyPhotos = async (e) => {
    e.preventDefault();
    if (propertyPhotoFiles.length === 0) {
      toast.error("Select at least one photo.");
      return;
    }
    try {
      setUploadingPhotos(true);
      const photoData = new FormData();
      propertyPhotoFiles.forEach((file) => photoData.append("photos", file));
      await api.post(`/owner/properties/${propertyId}/photos`, photoData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPropertyPhotoFiles([]);
      toast.success("Property photos uploaded.");
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to upload photos.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePropertyPhoto = async (photoUrl) => {
    try {
      setRemovingPhotoUrl(photoUrl);
      await api.delete(`/owner/properties/${propertyId}/photos`, { data: { photoUrl } });
      toast.success("Photo removed.");
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove photo.");
    } finally {
      setRemovingPhotoUrl("");
    }
  };

  const handleAssignTenant = async (e) => {
    e.preventDefault();
    try {
      setAssigningTenant(true);
      await api.post("/owner/leases", {
        propertyId,
        tenantId: assignForm.tenantId,
        leaseStartDate: assignForm.leaseStartDate,
        leaseEndDate: assignForm.leaseEndDate,
        rentAmount: Number(assignForm.rentAmount),
        securityDeposit: Number(assignForm.securityDeposit || 0),
        rentDueDay: Number(assignForm.rentDueDay || 1),
        graceDays: Number(assignForm.graceDays || 0),
        lateFeeType: assignForm.lateFeeType,
        lateFeeValue: Number(assignForm.lateFeeValue || 0),
      });
      toast.success("Tenant assigned to this property.");
      setShowAssignTenant(false);
      setAssignForm({
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
      navigate(`/owner/properties/${propertyId}/manage?tab=tenants`, { replace: true });
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to assign tenant.");
    } finally {
      setAssigningTenant(false);
    }
  };

  const markRentPaid = async (rentId) => {
    try {
      setPaymentUpdatingId(rentId);
      await api.patch(`/owner/rent/${rentId}/paid`, { paidDate: new Date().toISOString() });
      toast.success("Rent marked as paid.");
      await refreshWorkspace();
    } catch {
      toast.error("Failed to update rent status.");
    } finally {
      setPaymentUpdatingId("");
    }
  };

  const updateMaintenance = async (requestId, status) => {
    try {
      setMaintenanceUpdatingId(requestId);
      await api.patch(`/owner/maintenance/${requestId}/status`, {
        status,
        comment: maintenanceNote[requestId] || "",
      });
      setMaintenanceNote((prev) => ({ ...prev, [requestId]: "" }));
      toast.success("Maintenance request updated.");
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update maintenance request.");
    } finally {
      setMaintenanceUpdatingId("");
    }
  };

  const updateInquiryStatus = async (inquiryId, status) => {
    try {
      setInquiryUpdatingId(inquiryId);
      await api.patch(`/owner/inquiries/${inquiryId}/status`, { status });
      toast.success("Application status updated.");
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update application status.");
    } finally {
      setInquiryUpdatingId("");
    }
  };

  const verifyDocument = async (documentId, verificationStatus) => {
    try {
      setDocUpdatingId(documentId);
      await api.patch(`/owner/compliance-documents/${documentId}/verify`, {
        verificationStatus,
      });
      toast.success(`Document ${verificationStatus.toLowerCase()}.`);
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to verify document.");
    } finally {
      setDocUpdatingId("");
    }
  };

  const submitRenewal = async (e) => {
    e.preventDefault();
    try {
      setRenewalSaving(true);
      await api.post("/owner/renewals", renewalForm);
      toast.success("Renewal request created.");
      setShowCreateRenewalForm(false);
      setRenewalForm((prev) => ({ ...prev, note: "" }));
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create renewal request.");
    } finally {
      setRenewalSaving(false);
    }
  };

  const cancelRenewal = async (renewalId) => {
    try {
      setRenewalCancellingId(renewalId);
      await api.patch(`/owner/renewals/${renewalId}/cancel`);
      toast.success("Renewal request cancelled.");
      await refreshWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel renewal request.");
    } finally {
      setRenewalCancellingId("");
    }
  };

  const latestMoveOutByLeaseId = moveOutRequests.reduce((acc, request) => {
    const leaseId = request.lease?._id || request.lease;
    if (!leaseId) return acc;
    const existing = acc[leaseId];
    if (!existing || new Date(request.createdAt) > new Date(existing.createdAt)) {
      acc[leaseId] = request;
    }
    return acc;
  }, {});

  const tenantHistoryRows = allLeases.map((lease) => {
    const moveOut = latestMoveOutByLeaseId[lease._id];
    const lifecycleStatus = lease.isActive
      ? "Active"
      : moveOut?.status === "Completed"
      ? "Completed"
      : "Terminated";
    return {
      ...lease,
      lifecycleStatus,
      moveOut,
    };
  }).filter((row) => {
    if (historyStatusFilter === "All") return true;
    return row.lifecycleStatus === historyStatusFilter;
  }).sort((a, b) => new Date(b.leaseStartDate) - new Date(a.leaseStartDate));

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading property workspace...</div>;
  }

  if (!property) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Property not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex flex-col gap-4 border-b border-slate-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Property Management</p>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{propertyLabel}</h1>
          </div>

          <div className="relative">
            <select
              value={propertyId}
              onChange={(e) => navigate(`/owner/properties/${e.target.value}/manage`)}
              className="appearance-none rounded-xl border border-slate-600 bg-slate-800 py-2 pl-3 pr-9 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {properties.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.address?.street || "Property"} - {item.propertyType}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
        </div>

        <div className="bg-slate-900 px-3 pt-3">
          {/* Row 1: Overview, Tenant Details, Payments, Maintenance, Applications */}
          <div className="flex gap-2 pb-2">
            {tabs.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 inline-flex flex-col items-center justify-center gap-0.5 rounded-t-lg px-3 py-3 text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-cyan-300 border-b-3 border-cyan-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Property Photos, Tenant History, Documents, Renewals */}
          <div className="flex gap-2">
            {tabs.slice(5, 9).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 inline-flex flex-col items-center justify-center gap-0.5 rounded-t-lg px-3 py-3 text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-slate-800 text-cyan-300 border-b-3 border-cyan-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="min-h-screen">

      {activeTab === "overview" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500 p-2.5">
                <Building2 size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Property Overview</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-cyan-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">Property Type</p>
                <p className="mt-3 text-2xl font-extrabold text-cyan-900">{property.propertyType}</p>
                <p className="mt-1 text-xs text-cyan-600 font-semibold">{property.status}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Active Leases</p>
                <p className="mt-3 text-2xl font-extrabold text-emerald-900">{leases.filter((l) => l.isActive).length}</p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">Currently assigned</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Pending Payments</p>
                <p className="mt-3 text-2xl font-extrabold text-amber-900">{openRentCount}</p>
                <p className="mt-1 text-xs text-amber-600 font-semibold">Overdue or pending</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-600">Open Maintenance</p>
                <p className="mt-3 text-2xl font-extrabold text-rose-900">{maintenanceRequests.filter((r) => r.status !== "Resolved").length}</p>
                <p className="mt-1 text-xs text-rose-600 font-semibold">Needs attention</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h4 className="text-base font-bold text-gray-900">Property Location</h4>
            <p className="mt-4 inline-flex items-start gap-2 text-base text-gray-700"><MapPin size={18} className="mt-0.5 text-cyan-500 flex-shrink-0" />
              <span className="font-semibold">{property.address?.street}, {property.address?.city}, {property.address?.state}{property.address?.pincode ? ` - ${property.address.pincode}` : ""}</span>
            </p>
            {property.description ? <p className="mt-4 text-sm text-gray-600 leading-relaxed">{property.description}</p> : null}
          </div>
        </section>
      )}

      {activeTab === "photos" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-sky-500 p-2.5">
                <Image size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Property Gallery</h3>
              <span className="ml-auto rounded-full border border-sky-200 bg-sky-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-700">
                {(property.photoUrls || []).length} Photos
              </span>
            </div>

            <form onSubmit={uploadPropertyPhotos} className="rounded-xl border border-sky-200 bg-white p-4">
              <label className="text-sm font-bold text-gray-900">Upload New Photos</label>
              <p className="mt-1 text-xs text-gray-500">Select multiple images to upload</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setPropertyPhotoFiles(Array.from(e.target.files || []))}
                  className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded file:border file:border-sky-200 file:bg-sky-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-sky-700"
                />
                <button
                  type="submit"
                  disabled={uploadingPhotos}
                  className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-sky-600 hover:to-indigo-700 disabled:opacity-60"
                >
                  {uploadingPhotos ? "Uploading..." : "Upload Photos"}
                </button>
              </div>
            </form>
          </div>

          {(property.photoUrls || []).length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center">
              <Image size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">No photos uploaded yet. Add some images to your property!</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-base font-bold text-gray-900">Photo Gallery</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(property.photoUrls || []).map((url) => (
                  <div key={url} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all">
                    <div className="relative bg-gray-100 h-48">
                      <img src={toAssetUrl(url, apiOrigin)} alt="Property" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <button
                        type="button"
                        onClick={() => removePropertyPhoto(url)}
                        disabled={removingPhotoUrl === url}
                        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-60 transition-all shadow-md"
                      >
                        <Trash2 size={14} /> {removingPhotoUrl === url ? "Removing..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "tenants" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500 p-2.5">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tenant Management</h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAssignTenant((prev) => !prev)}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-indigo-600 hover:to-purple-700"
            >
              {showAssignTenant ? "Close Assignment" : "+ Assign New Tenant"}
            </button>

            {showAssignTenant ? (
              <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-5">
                <form onSubmit={handleAssignTenant} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Select Tenant</label>
                      <select
                        value={assignForm.tenantId}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                        required
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Select tenant...</option>
                        {tenantUsers.map((tenant) => (
                          <option key={tenant._id} value={tenant._id}>{tenant.name} ({tenant.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Monthly Rent</label>
                      <input
                        type="number"
                        min="0"
                        value={assignForm.rentAmount}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, rentAmount: e.target.value }))}
                        placeholder="Amount"
                        required
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Lease Start Date</label>
                      <input
                        type="date"
                        value={assignForm.leaseStartDate}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, leaseStartDate: e.target.value }))}
                        required
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Lease End Date</label>
                      <input
                        type="date"
                        value={assignForm.leaseEndDate}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, leaseEndDate: e.target.value }))}
                        required
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Security Deposit</label>
                      <input
                        type="number"
                        min="0"
                        value={assignForm.securityDeposit}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                        placeholder="Amount"
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Rent Due Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={assignForm.rentDueDay}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, rentDueDay: e.target.value }))}
                        placeholder="1-31"
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Grace Days</label>
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={assignForm.graceDays}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, graceDays: e.target.value }))}
                        placeholder="0-31"
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Late Fee Type</label>
                      <select
                        value={assignForm.lateFeeType}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, lateFeeType: e.target.value }))}
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="percent">Percent</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">Late Fee Value</label>
                      <input
                        type="number"
                        min="0"
                        value={assignForm.lateFeeValue}
                        onChange={(e) => setAssignForm((prev) => ({ ...prev, lateFeeValue: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={assigningTenant}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
                  >
                    {assigningTenant ? "Assigning Tenant..." : "Assign Tenant"}
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          {leases.length === 0 ? (
            <div className="rounded-lg border border-indigo-200 bg-white px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No lease records assigned to this property yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-base font-bold text-gray-900">Current & Past Assignments</h4>
              <div className="space-y-3">
                {leases.map((lease) => (
                  <div key={lease._id} className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 hover:shadow-md transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900">{lease.tenant?.name || "Tenant"}</p>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${lease.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"}`}>
                        {lease.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">{lease.tenant?.email || "No email"}</p>
                    <p className="mt-2 text-xs text-gray-700"><span className="font-bold">Lease Period:</span> {lease.leaseStartDate ? new Date(lease.leaseStartDate).toLocaleDateString() : "N/A"} – {lease.leaseEndDate ? new Date(lease.leaseEndDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "payments" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="rounded-lg bg-amber-500 p-2.5">
                <CreditCard size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Records</h3>
            </div>

            {rents.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No rent records for this property.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {rents.map((rent) => (
                  <div key={rent._id} className="rounded-xl border border-amber-200 bg-white p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900">{rent.month} {rent.year}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        rent.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : rent.status === "Overdue"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {rent.status}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-amber-900">{formatCurrency(rent.amount || 0)}</p>
                    <p className="mt-1 text-xs text-gray-600">Due: <span className="font-semibold">{rent.dueDate ? new Date(rent.dueDate).toLocaleDateString() : "N/A"}</span></p>
                    {rent.status !== "Paid" ? (
                      <button
                        type="button"
                        onClick={() => markRentPaid(rent._id)}
                        disabled={paymentUpdatingId === rent._id}
                        className="mt-3 w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                      >
                        {paymentUpdatingId === rent._id ? "Updating..." : "Mark as Paid"}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "maintenance" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="rounded-lg bg-rose-500 p-2.5">
                <Wrench size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Maintenance Requests</h3>
            </div>

            {maintenanceRequests.length === 0 ? (
              <div className="rounded-lg border border-rose-200 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No maintenance requests for this property.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.map((request) => (
                  <div key={request._id} className="rounded-xl border border-rose-200 bg-white p-4 hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{request.category || "Maintenance Request"}</p>
                    <select
                      value={request.status}
                      onChange={(e) => updateMaintenance(request._id, e.target.value)}
                      disabled={maintenanceUpdatingId === request._id}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{request.description || "No description"}</p>
                  <p className="mt-2 text-xs text-gray-500">Tenant: {request.tenant?.name || "N/A"}</p>

                  <div className="mt-3 rounded-lg border border-gray-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Comment History</p>
                    {!request.comments || request.comments.length === 0 ? (
                      <p className="mt-2 text-xs text-gray-500">No comments yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {request.comments.map((comment, idx) => (
                          <div key={`${request._id}-comment-${idx}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                            <p className="text-xs text-gray-700">{comment.text}</p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {comment.addedBy?.name || "User"}
                              {comment.addedBy?.role ? ` (${comment.addedBy.role})` : ""}
                              {comment.createdAt ? ` • ${new Date(comment.createdAt).toLocaleString()}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={maintenanceNote[request._id] || ""}
                      onChange={(e) => setMaintenanceNote((prev) => ({ ...prev, [request._id]: e.target.value }))}
                      placeholder="Add owner note"
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => updateMaintenance(request._id, request.status)}
                      disabled={maintenanceUpdatingId === request._id}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                    >
                      {maintenanceUpdatingId === request._id ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </section>
      )}

      {activeTab === "applications" && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Applications</h3>
            {inquiries.length === 0 ? (
              <div className="rounded-lg border border-indigo-200 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No applications/inquiries for this property.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inquiry) => (
                  <div key={inquiry._id} className="rounded-xl border border-indigo-200 bg-white p-4 hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{inquiry.inquirer?.name || "Applicant"}</p>
                    <select
                      value={inquiry.status || "New"}
                      onChange={(e) => updateInquiryStatus(inquiry._id, e.target.value)}
                      disabled={inquiryUpdatingId === inquiry._id}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{inquiry.inquirer?.email || "No email"}</p>
                  {inquiry.message ? <p className="mt-2 text-sm text-gray-600">{inquiry.message}</p> : null}
                </div>
                ))}
              </div>
            )}
        </section>
      )}

      {activeTab === "documents" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="rounded-lg bg-blue-500 p-2.5">
                <FileText size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
            </div>
            {documents.length === 0 ? (
              <div className="rounded-lg border border-blue-200 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No uploaded documents for this property.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc._id} className="rounded-xl border border-blue-200 bg-white p-4 hover:shadow-md transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{doc.documentType}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      doc.verificationStatus === "Verified"
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.verificationStatus === "Rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {doc.verificationStatus || "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Tenant: {doc.tenant?.name || "N/A"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={`${apiOrigin}${doc.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      View Document
                    </a>
                    {doc.verificationStatus !== "Verified" ? (
                      <button
                        type="button"
                        onClick={() => verifyDocument(doc._id, "Verified")}
                        disabled={docUpdatingId === doc._id}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        Verify
                      </button>
                    ) : null}
                    {doc.verificationStatus !== "Rejected" ? (
                      <button
                        type="button"
                        onClick={() => verifyDocument(doc._id, "Rejected")}
                        disabled={docUpdatingId === doc._id}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    ) : null}
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "tenantHistory" && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2">
              <div className="rounded-lg bg-teal-500 p-2.5">
                <History size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tenant History</h3>
            </div>
            
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
              >
                <option value="All">All Tenants</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
              </select>
              <span className="rounded-full border border-teal-200 bg-teal-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                {tenantHistoryRows.length} Records
              </span>
            </div>

            {tenantHistoryRows.length === 0 ? (
              <div className="rounded-lg border border-teal-200 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No tenant history records for this filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenantHistoryRows.map((row) => (
                  <div key={row._id} className="rounded-xl border border-teal-200 bg-white p-4 hover:shadow-md transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900">{row.tenant?.name || "Tenant"}</p>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      row.lifecycleStatus === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : row.lifecycleStatus === "Completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {row.lifecycleStatus}
                    </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">{row.tenant?.email || "No email"}</p>
                    <p className="mt-2 text-xs text-gray-700">
                      <span className="font-bold">Lease Period:</span> {row.leaseStartDate ? new Date(row.leaseStartDate).toLocaleDateString() : "N/A"} – {row.leaseEndDate ? new Date(row.leaseEndDate).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-gray-700"><span className="font-bold">Monthly Rent:</span> {formatCurrency(row.rentAmount || 0)}</p>
                  {row.moveOut ? (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                      <p className="font-semibold text-gray-700">Move-Out: {row.moveOut.status}</p>
                      <p className="mt-1">Requested: {row.moveOut.requestedMoveOutDate ? new Date(row.moveOut.requestedMoveOutDate).toLocaleDateString() : "N/A"}</p>
                      <p className="mt-1">Completed: {row.moveOut.completedAt ? new Date(row.moveOut.completedAt).toLocaleDateString() : "Not completed"}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        </section>
      )}

      {activeTab === "renewals" && (
        <section className="space-y-5">
          {showCreateRenewalForm && (
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-violet-500 p-2">
                    <RotateCcw size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Create Renewal Request</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateRenewalForm(false)}
                  className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={submitRenewal} className="space-y-4">
                {/* Row 1: Lease Selection */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">Select Tenant Lease</label>
                    <select
                      value={renewalForm.leaseId}
                      onChange={(e) => setRenewalForm((prev) => ({ ...prev, leaseId: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    >
                      <option value="">Select Lease...</option>
                      {leases.filter((lease) => lease.isActive).map((lease) => (
                        <option key={lease._id} value={lease._id}>{lease.tenant?.name || "Tenant"}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">Proposed Monthly Rent</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={renewalForm.proposedRentAmount}
                      onChange={(e) => setRenewalForm((prev) => ({ ...prev, proposedRentAmount: e.target.value }))}
                      placeholder="Amount"
                      required
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">Renewal Start Date</label>
                    <input
                      type="date"
                      value={renewalForm.proposedLeaseStartDate}
                      onChange={(e) => setRenewalForm((prev) => ({ ...prev, proposedLeaseStartDate: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>

                {/* Row 2: End Date & Notes */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">Renewal End Date</label>
                    <input
                      type="date"
                      value={renewalForm.proposedLeaseEndDate}
                      onChange={(e) => setRenewalForm((prev) => ({ ...prev, proposedLeaseEndDate: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">Additional Notes</label>
                    <textarea
                      rows={1}
                      value={renewalForm.note}
                      onChange={(e) => setRenewalForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Add any special terms or notes for tenant..."
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={renewalSaving || !renewalForm.leaseId}
                  className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-violet-600 hover:to-indigo-700 disabled:opacity-60 sm:w-auto"
                >
                  {renewalSaving ? "Creating Renewal..." : "Create Renewal Request"}
                </button>
              </form>
            </div>
          )}

          {/* Renewal Records */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-base font-bold text-gray-900">Renewal History</h4>
              {!showCreateRenewalForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateRenewalForm(true)}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                >
                  Add Renewal Request
                </button>
              )}
            </div>
            {renewals.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No renewal records for this property yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {renewals.map((renewal) => (
                  <div key={renewal._id} className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-all hover:border-violet-200 hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{renewal.tenant?.name || "Tenant"}</p>
                        <p className="mt-1 text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">{formatCurrency(renewal.proposedRentAmount || 0)}</span>/month
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {renewal.proposedLeaseStartDate ? new Date(renewal.proposedLeaseStartDate).toLocaleDateString() : "N/A"}
                          {" – "}
                          {renewal.proposedLeaseEndDate ? new Date(renewal.proposedLeaseEndDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        renewal.status === "Accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : renewal.status === "Rejected" || renewal.status === "Cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {renewal.status}
                      </span>
                    </div>
                    {renewal.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() => cancelRenewal(renewal._id)}
                        disabled={renewalCancellingId === renewal._id}
                        className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
                      >
                        {renewalCancellingId === renewal._id ? "Cancelling..." : "Cancel Request"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default PropertyWorkspace;
