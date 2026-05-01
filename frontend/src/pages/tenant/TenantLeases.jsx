import React, { useEffect, useState } from "react";
import { CalendarDays, DoorOpen, FileText, Home, Landmark, ShieldCheck, Upload, UserCircle2, Wallet } from "lucide-react";
import { EmptyState, Modal, PageHeader, StatusBadge } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const DOC_TYPES = ["Rent Agreement", "Aadhaar Card", "PAN Card", "Police Verification", "Other"];

export default function TenantLeases() {
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [complianceDocs, setComplianceDocs] = useState([]);
  const [moveOutModal, setMoveOutModal] = useState(false);
  const [docsModal, setDocsModal] = useState(false);
  const [viewDocsModal, setViewDocsModal] = useState(false);
  const [renewalModal, setRenewalModal] = useState(false);
  const [selectedDocsLease, setSelectedDocsLease] = useState(null);
  const [selectedRenewalLease, setSelectedRenewalLease] = useState(null);
  const [submittingMoveOut, setSubmittingMoveOut] = useState(false);
  const [submittingRenewalDecision, setSubmittingRenewalDecision] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [cancellingMoveOutId, setCancellingMoveOutId] = useState(null);
    const fetchLeases = async () => {
      try {
        const { data } = await api.get("/tenant/leases");
        setLeases(data?.leases || []);
      } catch (err) {
        try {
          const fallback = await api.get("/tenant/lease");
          setLeases(fallback?.data?.lease ? [fallback.data.lease] : []);
        } catch (fallbackErr) {
          if (fallbackErr?.response?.status !== 404) {
            toast.error("Failed to load lease details.");
          }
          setLeases([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchTenantRenewals = async () => {
      try {
        const { data } = await api.get("/tenant/renewals");
        setRenewals(data?.renewals || []);
      } catch {
        setRenewals([]);
      }
    };

  const [moveOutForm, setMoveOutForm] = useState({ requestedMoveOutDate: "", reason: "" });
  const [docForm, setDocForm] = useState({
    documentType: "Aadhaar Card",
    documentNumber: "",
    notes: "",
    document: null,
  });

  const fetchMoveOutRequests = async () => {
    try {
      const { data } = await api.get("/tenant/move-out");
      setMoveOutRequests(data?.requests || []);
    } catch {
      setMoveOutRequests([]);
    }
  };

  const fetchComplianceDocs = async () => {
    try {
      const { data } = await api.get("/tenant/compliance-documents");
      setComplianceDocs(data?.documents || []);
    } catch {
      setComplianceDocs([]);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  useEffect(() => {
    fetchMoveOutRequests();
    fetchComplianceDocs();
    fetchTenantRenewals();
  }, []);

  const openMoveOutModal = () => {
    setMoveOutForm({ requestedMoveOutDate: "", reason: "" });
    setMoveOutModal(true);
  };

  const handleMoveOutRequest = async (e) => {
    e.preventDefault();
    setSubmittingMoveOut(true);
    try {
      await api.post("/tenant/move-out", moveOutForm);
      toast.success("Move-out request submitted successfully!");
      setMoveOutModal(false);
      await fetchMoveOutRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit move-out request.");
    } finally {
      setSubmittingMoveOut(false);
    }
  };

  const cancelMoveOutRequest = async (requestId) => {
    if (!requestId) return;
    try {
      setCancellingMoveOutId(requestId);
      await api.patch(`/tenant/move-out/${requestId}/cancel`, {
        reason: "Request cancelled by tenant to continue lease.",
      });
      toast.success("Move-out request cancelled. Your lease will continue.");
      await fetchMoveOutRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel move-out request.");
    } finally {
      setCancellingMoveOutId(null);
    }
  };

  const uploadComplianceDoc = async (e) => {
    e.preventDefault();
    if (!selectedDocsLease?.isActive) {
      toast.error("Documents can be uploaded only for an active lease.");
      return;
    }

    if (!docForm.document) {
      toast.error("Please select a document file.");
      return;
    }

    const payload = new FormData();
    payload.append("documentType", docForm.documentType);
    payload.append("documentNumber", docForm.documentNumber);
    payload.append("notes", docForm.notes);
    payload.append("document", docForm.document);

    setUploadingDoc(true);
    try {
      await api.post("/tenant/compliance-documents", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully.");
      setDocForm({ documentType: "Aadhaar Card", documentNumber: "", notes: "", document: null });
      setDocsModal(false);
      await fetchComplianceDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const openRenewalModal = (lease) => {
    setSelectedRenewalLease(lease);
    setRenewalModal(true);
  };

  const submitRenewalDecision = async (renewalId, status) => {
    if (!renewalId) return;
    try {
      setSubmittingRenewalDecision(true);
      await api.patch(`/tenant/renewals/${renewalId}/decision`, {
        status,
        decisionNote: status === "Accepted"
          ? "Accepted by tenant from lease expiry warning flow."
          : "Rejected by tenant from lease expiry warning flow.",
      });
      toast.success(`Renewal ${status.toLowerCase()} successfully.`);
      setRenewalModal(false);
      await Promise.all([fetchTenantRenewals(), fetchLeases()]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit renewal decision.");
    } finally {
      setSubmittingRenewalDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!leases.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Leases"
          subtitle="View your active lease agreements and key tenancy terms."
        />
        <EmptyState title="No active leases found" subtitle="Your lease details will appear here once your tenancy is active." />
      </div>
    );
  }

  const totalMonthlyRent = leases.reduce((sum, item) => sum + Number(item.rentAmount || 0), 0);
  const latestLeaseEnd = leases
    .map((item) => item.leaseEndDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  const maxDaysLeft = latestLeaseEnd
    ? Math.max(0, Math.ceil((new Date(latestLeaseEnd) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leases"
        subtitle="Track all your active leases, rent terms, and important dates in one place."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            title: "Active Leases",
            value: leases.length,
            subtitle: "Current agreements",
            icon: Home,
            tone: "from-emerald-500 to-teal-600 border-emerald-100 bg-emerald-50/80 text-emerald-900",
          },
          {
            title: "Total Monthly Rent",
            value: formatCurrency(totalMonthlyRent),
            subtitle: "All active leases",
            icon: Wallet,
            tone: "from-cyan-500 to-blue-600 border-cyan-100 bg-cyan-50/80 text-cyan-900",
          },
          {
            title: "Next Lease End",
            value: formatDate(latestLeaseEnd),
            subtitle: `${maxDaysLeft} day(s) left`,
            icon: CalendarDays,
            tone: "from-amber-400 to-orange-500 border-amber-100 bg-amber-50/80 text-amber-900",
          },
          {
            title: "Combined Deposit",
            value: formatCurrency(leases.reduce((sum, item) => sum + Number(item.securityDeposit || 0), 0)),
            subtitle: "Refundable",
            icon: Landmark,
            tone: "from-violet-500 to-fuchsia-600 border-violet-100 bg-violet-50/80 text-violet-900",
          },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.title} className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${tile.tone.split(" ").slice(2).join(" ")}`}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tile.tone.split(" ").slice(0, 2).join(" ")}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">{tile.title}</p>
                  <p className="mt-2 text-xl font-extrabold leading-none truncate">{tile.value}</p>
                  <p className="mt-1 text-[11px] opacity-70">{tile.subtitle}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${tile.tone.split(" ").slice(0, 2).join(" ")} p-2 text-white shadow-md`}>
                  <Icon size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {leases.map((lease) => {
          const daysLeft = lease?.leaseEndDate
            ? Math.max(0, Math.ceil((new Date(lease.leaseEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
            : 0;
          const expiryGraceDeadline = lease?.leaseEndDate
            ? new Date(new Date(lease.leaseEndDate).getTime() + (7 * 24 * 60 * 60 * 1000))
            : null;
          const isLeaseExpired = daysLeft === 0;
          const leaseRequests = moveOutRequests.filter((request) => {
            const leaseId = request.lease?._id || request.lease;
            return String(leaseId) === String(lease._id);
          });
          const pendingRenewal = renewals.find(
            (renewal) => String(renewal.lease?._id || renewal.lease) === String(lease._id) && renewal.status === "Pending"
          );
          const latestMoveOut = leaseRequests[0] || null;
          const hasRaisedMoveOut = leaseRequests.length > 0;
          const canCancelMoveOut = ["Pending", "Approved"].includes(latestMoveOut?.status || "");
          const canRaiseMoveOut = !latestMoveOut || ["Cancelled", "Rejected"].includes(latestMoveOut?.status || "");
          const leaseDocs = complianceDocs.filter((doc) => String(doc.lease?._id || doc.lease) === String(lease._id));

          return (
            <div key={lease._id} className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {lease.property?.address?.society || "Property"} / {lease.property?.propertyType || "Home"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[
                      lease.property?.address?.street,
                      lease.property?.address?.city,
                      lease.property?.address?.state,
                      lease.property?.address?.pincode,
                    ].filter(Boolean).join(", ") || "Address not available"}
                  </p>
                </div>
                <StatusBadge status={lease.isActive ? "Active" : "Inactive"} />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Property</p>
                    <p className="mt-1 font-semibold text-gray-900 truncate">{lease.property?.propertyType || "Property"}</p>
                    <p className="mt-0.5 text-gray-600 break-words leading-relaxed">
                      {[
                        lease.property?.address?.society,
                        lease.property?.address?.street,
                        lease.property?.address?.city,
                        lease.property?.address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Address not available"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Owner</p>
                    <p className="mt-1 font-semibold text-gray-900 inline-flex items-center gap-1 truncate max-w-full">
                      <UserCircle2 size={12} className="text-gray-500 shrink-0" />
                      <span className="truncate">{lease.owner?.name || "Owner"}</span>
                    </p>
                    <p className="mt-0.5 text-gray-600 truncate">{lease.owner?.phone || lease.owner?.email || "Contact not available"}</p>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Lease</p>
                    <p className="mt-1 font-semibold text-gray-900 text-[11px]">{formatDate(lease.leaseStartDate)} - {formatDate(lease.leaseEndDate)}</p>
                    <p className="mt-0.5 text-gray-600">{daysLeft} day(s) left</p>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Financials</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(lease.rentAmount || 0)} rent</p>
                    <p className="mt-0.5 text-gray-600">
                      {formatCurrency(lease.securityDeposit || 0)} deposit
                    </p>
                    <p className="mt-0.5 text-gray-600">
                      Due {lease.rentDueDay || 1} | Grace {lease.graceDays || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                  <div className="space-y-3">
                    {isLeaseExpired ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-semibold text-red-800">Lease has reached end date.</p>
                        <p className="mt-1 text-xs text-red-700">
                          Renew your lease and re-upload documents now. If this is not completed in next 7 days (by {formatDate(expiryGraceDeadline)}), your lease will be terminated.
                        </p>
                        {pendingRenewal ? (
                          <p className="mt-1 text-xs text-red-700">
                            Owner proposal available: {formatCurrency(pendingRenewal.proposedRentAmount || 0)} from {formatDate(pendingRenewal.proposedLeaseStartDate)} to {formatDate(pendingRenewal.proposedLeaseEndDate)}.
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-red-700">No pending owner renewal proposal yet. Please contact owner and request a renewal proposal.</p>
                        )}
                      </div>
                    ) : null}

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                      <p className="text-sm font-semibold text-gray-800 inline-flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-600" /> Compliance Documents
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Uploaded for this lease: <span className="font-semibold text-gray-700">{leaseDocs.length}</span>
                      </p>
                      {leaseDocs.length > 0 ? (
                        <p className="text-xs text-gray-600 mt-1">
                          Latest: {leaseDocs[0].documentType} on {new Date(leaseDocs[0].createdAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">No documents uploaded for this lease yet.</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                      <p className="text-sm font-semibold text-gray-800 inline-flex items-center gap-1.5">
                        <DoorOpen size={15} className="text-indigo-500" /> Move-Out Request
                      </p>
                      {latestMoveOut ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <StatusBadge status={latestMoveOut.status} />
                          <span className="text-gray-600">Requested for {formatDate(latestMoveOut.requestedMoveOutDate)}</span>
                          {latestMoveOut.status === "Approved" && latestMoveOut.approvedLastStayingDate && (
                            <span className="text-emerald-700 font-medium">· Last day: {formatDate(latestMoveOut.approvedLastStayingDate)}</span>
                          )}
                          {latestMoveOut.status === "Rejected" && latestMoveOut.ownerNote && (
                            <span className="text-red-600">· {latestMoveOut.ownerNote}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">No move-out request yet.</p>
                      )}
                      {hasRaisedMoveOut && !canCancelMoveOut && !canRaiseMoveOut ? (
                        <p className="text-xs text-gray-500 mt-1">Move-out is already in final stage. New request is currently disabled.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white p-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-gray-500">Quick Actions</p>
                    <div className="mt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocsLease(lease);
                          setDocsModal(true);
                        }}
                        disabled={!lease.isActive}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <Upload size={13} /> {isLeaseExpired ? "Re-Upload Documents" : "Upload Documents"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocsLease(lease);
                          setViewDocsModal(true);
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <FileText size={13} /> View Documents
                      </button>

                      {isLeaseExpired ? (
                        <button
                          type="button"
                          onClick={() => openRenewalModal(lease)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                        >
                          <CalendarDays size={13} /> Renew Lease
                        </button>
                      ) : null}

                      {canRaiseMoveOut ? (
                        <button
                          type="button"
                          onClick={openMoveOutModal}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <DoorOpen size={13} /> Request Move-Out
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `${API_BASE}/api/leases/${lease._id}/rent-agreement`,
                              { headers: { Authorization: `Bearer ${localStorage.getItem("pms_token")}` } }
                            );
                            if (!response.ok) throw new Error();
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `rent-agreement-${lease._id}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } catch {
                            toast.error("Unable to download agreement.");
                          }
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <FileText size={13} /> Download Agreement
                      </button>

                      {canCancelMoveOut ? (
                        <button
                          type="button"
                          onClick={() => cancelMoveOutRequest(latestMoveOut._id)}
                          disabled={cancellingMoveOutId === latestMoveOut._id}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {cancellingMoveOutId === latestMoveOut._id ? "Cancelling..." : "Cancel Move-Out"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={moveOutModal} onClose={() => setMoveOutModal(false)} title="Request Move-Out">
        <form onSubmit={handleMoveOutRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requested Move-Out Date</label>
            <input
              type="date"
              required
              value={moveOutForm.requestedMoveOutDate}
              onChange={(e) => setMoveOutForm({ ...moveOutForm, requestedMoveOutDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <textarea
              rows={3}
              value={moveOutForm.reason}
              onChange={(e) => setMoveOutForm({ ...moveOutForm, reason: e.target.value })}
              className="input-field"
              placeholder="Mention relocation, job change, purchase, or other context"
            />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            After owner approval, you will see the confirmed last staying day and closing formalities here.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMoveOutModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submittingMoveOut} className="btn-primary">
              {submittingMoveOut ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={docsModal} onClose={() => setDocsModal(false)} title={`Upload Compliance Document${selectedDocsLease ? ` - ${selectedDocsLease.property?.propertyType || "Lease"}` : ""}`}>
        <form onSubmit={uploadComplianceDoc} className="space-y-4">
          {selectedDocsLease && !selectedDocsLease.isActive ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This lease is inactive. Upload is only available for active leases.
            </div>
          ) : null}
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
              placeholder="e.g. XXXXX1234"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setDocForm({ ...docForm, document: e.target.files?.[0] || null })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows={3}
              value={docForm.notes}
              onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setDocsModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={uploadingDoc || !docForm.document || !selectedDocsLease?.isActive} className="btn-primary">
              {uploadingDoc ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewDocsModal} onClose={() => setViewDocsModal(false)} title={`Lease Documents${selectedDocsLease ? ` - ${selectedDocsLease.property?.propertyType || "Lease"}` : ""}`} size="lg">
        {(selectedDocsLease
          ? complianceDocs.filter((doc) => String(doc.lease?._id || doc.lease) === String(selectedDocsLease._id))
          : []).length === 0 ? (
          <p className="text-sm text-gray-600">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {complianceDocs
              .filter((doc) => String(doc.lease?._id || doc.lease) === String(selectedDocsLease?._id))
              .map((doc) => (
              <a
                key={doc._id}
                href={`${API_BASE}${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-gray-100 bg-white px-3 py-2 hover:bg-gray-50"
              >
                <p className="text-sm font-semibold text-gray-900 inline-flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" /> {doc.documentType}
                </p>
                <p className="text-xs text-gray-600 mt-1">Uploaded on {new Date(doc.createdAt).toLocaleDateString()}</p>
                {doc.documentNumber ? <p className="text-xs text-gray-500">No: {doc.documentNumber}</p> : null}
              </a>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={renewalModal}
        onClose={() => setRenewalModal(false)}
        title={`Renew Lease${selectedRenewalLease ? ` - ${selectedRenewalLease.property?.propertyType || "Lease"}` : ""}`}
      >
        {(() => {
          const renewal = renewals.find(
            (item) => String(item.lease?._id || item.lease) === String(selectedRenewalLease?._id) && item.status === "Pending"
          );

          if (!renewal) {
            return (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  No pending renewal proposal found from owner for this lease.
                </div>
                <p className="text-sm text-gray-700">
                  Please ask the owner to send a renewal proposal. You can re-upload compliance documents now to avoid delays.
                </p>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setRenewalModal(false)} className="btn-secondary">Close</button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                <p className="font-semibold">Owner Renewal Proposal</p>
                <p className="mt-1">Proposed Rent: {formatCurrency(renewal.proposedRentAmount || 0)}</p>
                <p className="mt-1">Term: {formatDate(renewal.proposedLeaseStartDate)} to {formatDate(renewal.proposedLeaseEndDate)}</p>
                {renewal.note ? <p className="mt-1">Note: {renewal.note}</p> : null}
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                Warning: If renewal and required document upload are not completed within 7 days after lease end, the lease may be terminated.
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => submitRenewalDecision(renewal._id, "Rejected")}
                  disabled={submittingRenewalDecision}
                  className="btn-secondary"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => submitRenewalDecision(renewal._id, "Accepted")}
                  disabled={submittingRenewalDecision}
                  className="btn-primary"
                >
                  {submittingRenewalDecision ? "Submitting..." : "Accept Renewal"}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}