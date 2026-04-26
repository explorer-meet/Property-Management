import React, { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Search,
  CalendarDays,
  MapPin,
  ReceiptText,
  Download,
  QrCode,
  Landmark,
  Smartphone,
  Send,
  CreditCard,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Zap,
  Shield,
  Lock,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState, Modal } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

// Dynamically load Razorpay checkout script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const TenantRent = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payModal, setPayModal] = useState(false);
  const [selectedRent, setSelectedRent] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const [ownerPaymentDetails, setOwnerPaymentDetails] = useState(null);
  const [paymentDetailView, setPaymentDetailView] = useState("account");
  const [paymentForm, setPaymentForm] = useState({
    transactionId: "",
    paidDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchRents = useCallback(async () => {
    try {
      const { data } = await api.get("/tenant/rent-history");
      setRents(data.rents);
    } catch {
      toast.error("Failed to load rent history.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOwnerPaymentDetails = useCallback(async () => {
    try {
      const { data } = await api.get("/tenant/owner-payment-details");
      setOwnerPaymentDetails(data.paymentDetails || null);
    } catch {
      setOwnerPaymentDetails(null);
    }
  }, []);

  useEffect(() => {
    fetchRents();
    fetchOwnerPaymentDetails();
    loadRazorpayScript();
  }, [fetchRents, fetchOwnerPaymentDetails]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );

  const pending = rents.filter((r) => r.status === "Pending").length;
  const overdue = rents.filter((r) => r.status === "Overdue").length;
  const paid = rents.filter((r) => r.status === "Paid").length;
  const totalAmount = rents.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const paidAmount = rents.filter((r) => r.status === "Paid").reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleRents = rents.filter((r) => {
    if (!normalizedSearch) return true;
    const haystack = [r.month, String(r.year), r.property?.propertyType, r.property?.address?.city, r.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const downloadReceipt = async (rentId) => {
    try {
      const response = await api.get(`/rent/${rentId}/receipt`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${rentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download receipt.");
    }
  };

  const openPayModal = (rent) => {
    const hasQr = Boolean(ownerPaymentDetails?.qrCodeImageUrl);
    const hasAccount = Boolean(
      ownerPaymentDetails?.accountHolderName ||
        ownerPaymentDetails?.bankName ||
        ownerPaymentDetails?.accountNumber ||
        ownerPaymentDetails?.ifscCode ||
        ownerPaymentDetails?.upiId
    );
    setSelectedRent(rent);
    setPaymentDetailView(hasAccount ? "account" : hasQr ? "qr" : "account");
    setPaymentForm({
      transactionId: rent.paymentSubmission?.transactionId || "",
      paidDate: rent.paymentSubmission?.paidAt
        ? new Date(rent.paymentSubmission.paidAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      notes: rent.paymentSubmission?.notes || "",
    });
    setPayModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selectedRent?._id) return;
    setSubmittingPayment(true);
    try {
      await api.post(`/tenant/rent/${selectedRent._id}/submit-payment`, paymentForm);
      toast.success("Payment details submitted. Owner will verify shortly.");
      setPayModal(false);
      setSelectedRent(null);
      fetchRents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit payment details.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePayOnline = async (rent) => {
    setPayingOnline(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load payment gateway. Please check your internet connection.");
        return;
      }

      const { data: order } = await api.post(`/tenant/rent/${rent._id}/create-payment-order`);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "PropManager",
        description: `Rent – ${order.month} ${order.year}`,
        order_id: order.orderId,
        theme: { color: "#4f46e5" },
        prefill: {},
        handler: async (response) => {
          try {
            const { data: result } = await api.post(`/tenant/rent/${rent._id}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Payment successful! Receipt #${result.receiptNumber}`);
            fetchRents();
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "ℹ️" });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to initiate payment.";
      if (msg.includes("not enabled")) {
        toast.error("Online payment is not configured yet. Use manual payment below.");
        openPayModal(rent);
      } else {
        toast.error(msg);
      }
    } finally {
      setPayingOnline(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Rent & Payments" subtitle="Your rent records and payment history" />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-emerald-900 px-6 py-8 sm:px-8 shadow-2xl">
        <div className="absolute -top-12 -right-10 h-36 w-36 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              <Zap size={11} className="text-yellow-300" /> Powered by Razorpay
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold">Pay rent securely online</h2>
            <p className="mt-2 text-sm text-blue-100 max-w-xl leading-6">
              Pay instantly with UPI, Cards, Net Banking or Wallets. Your payment is verified automatically — no waiting for owner confirmation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["UPI", "Debit/Credit Cards", "Net Banking", "Wallets"].map((m) => (
                <span key={m} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                  <CheckCircle2 size={11} className="text-emerald-300" /> {m}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-200 font-semibold">Total Paid</p>
              <p className="mt-1 text-3xl font-extrabold">{formatCurrency(paidAmount)}</p>
              <p className="text-xs text-cyan-100">out of {formatCurrency(totalAmount)}</p>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-xl font-bold text-emerald-300">{paid}</p>
                <p className="text-xs text-white/70">Paid</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-300">{pending}</p>
                <p className="text-xs text-white/70">Pending</p>
              </div>
              <div>
                <p className="text-xl font-bold text-rose-300">{overdue}</p>
                <p className="text-xs text-white/70">Overdue</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Paid", count: paid, color: "emerald", icon: CheckCircle2 },
          { label: "Pending", count: pending, color: "amber", icon: Clock3 },
          { label: "Overdue", count: overdue, color: "rose", icon: AlertTriangle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border border-${color}-100 bg-${color}-50 p-5 flex items-center gap-4`}>
            <div className={`rounded-xl bg-${color}-100 p-3`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <div>
              <p className={`text-2xl font-bold text-${color}-700`}>{count}</p>
              <p className={`text-sm font-medium text-${color}-600`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
          <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-gray-400 flex items-center">
            <Search size={16} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by month, year, property or status…"
            className="w-full px-3 py-2.5 text-sm text-gray-700 bg-white outline-none"
          />
        </div>
      </div>

      {/* Rent Table */}
      {visibleRents.length === 0 ? (
        <EmptyState message="No rent records yet." icon={DollarSign} />
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                <tr className="text-left">
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Month / Year</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Property</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Due Date</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Paid Date</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-700 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleRents.map((r) => {
                  const isUnpaid = r.status !== "Paid";
                  const isOverdue = r.status === "Overdue";
                  return (
                    <tr
                      key={r._id}
                      className={`transition-colors ${isOverdue ? "bg-rose-50/40 hover:bg-rose-50" : "hover:bg-gray-50/80"}`}
                    >
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-indigo-400" />
                          {r.month} {r.year}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} className="text-gray-400" />
                          {r.property?.propertyType} – {r.property?.address?.city}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-900">{formatCurrency(r.amount)}</div>
                        {r.lateFeeAmount > 0 && (
                          <div className="text-[11px] text-rose-600 font-medium">+{formatCurrency(r.lateFeeAmount)} late fee</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-xs">{new Date(r.dueDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-4 text-gray-600 text-xs">
                        {r.paidDate ? (
                          <span className="inline-flex items-center gap-1.5">
                            <ReceiptText size={12} className="text-emerald-500" />
                            {new Date(r.paidDate).toLocaleDateString("en-IN")}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <StatusBadge status={r.status} />
                          {r.paymentMethod === "online" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                              <Zap size={9} /> Online
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          {isUnpaid && (
                            <>
                              {/* Primary: Pay Online */}
                              <button
                                type="button"
                                onClick={() => handlePayOnline(r)}
                                disabled={payingOnline}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-60"
                              >
                                <CreditCard size={12} />
                                {payingOnline ? "Opening…" : "Pay Online"}
                              </button>

                              {/* Secondary: Manual */}
                              <button
                                type="button"
                                onClick={() => openPayModal(r)}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                <QrCode size={11} /> Manual Pay
                              </button>
                            </>
                          )}

                          {r.paymentSubmission?.status === "Submitted" && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                              <Clock3 size={11} /> Awaiting Confirmation
                            </span>
                          )}

                          {r.status === "Paid" && (
                            <button
                              type="button"
                              onClick={() => downloadReceipt(r._id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <Download size={12} /> Download Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trust Footer */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-emerald-500" /> 256-bit SSL Encryption</span>
        <span className="inline-flex items-center gap-1.5"><Shield size={13} className="text-blue-500" /> RBI Compliant Payments</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-indigo-500" /> Powered by Razorpay</span>
        <span className="inline-flex items-center gap-1.5"><Zap size={13} className="text-amber-500" /> Instant Verification</span>
      </div>

      {/* Manual Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title={`Manual Payment – ${selectedRent?.month || ""} ${selectedRent?.year || ""}`}>
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Manual Payment Flow</p>
            <p className="text-xs mt-0.5">Transfer rent to the owner using the details below, then enter your transaction ID. The owner will confirm receipt.</p>
          </div>

          {ownerPaymentDetails && Object.values(ownerPaymentDetails).some(Boolean) ? (
            <div className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-white">
                <p className="text-sm font-semibold">Owner Payment Details</p>
                <p className="text-xs text-indigo-100">Choose one method and complete your transfer</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="inline-flex rounded-xl border border-indigo-100 bg-indigo-50 p-1">
                  {[{ key: "account", icon: Landmark, label: "Account Details" }, { key: "qr", icon: QrCode, label: "QR Code" }].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentDetailView(key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        paymentDetailView === key ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-600 hover:text-indigo-700"
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {paymentDetailView === "account" ? (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                    <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                      {[
                        { key: "accountHolderName", label: "A/C Holder" },
                        { key: "bankName", label: "Bank Name" },
                        { key: "accountNumber", label: "Account No." },
                        { key: "ifscCode", label: "IFSC" },
                        { key: "upiId", label: "UPI ID" },
                      ].map(({ key, label }) =>
                        ownerPaymentDetails[key] ? (
                          <React.Fragment key={key}>
                            <p className="text-xs font-semibold tracking-wide text-indigo-700 uppercase self-center">{label}</p>
                            <p className="font-mono text-gray-900 break-all">{ownerPaymentDetails[key]}</p>
                          </React.Fragment>
                        ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col items-center gap-3">
                    {ownerPaymentDetails.qrCodeImageUrl ? (
                      <>
                        <p className="text-xs font-semibold text-gray-600">Scan QR to Pay</p>
                        <img
                          src={ownerPaymentDetails.qrCodeImageUrl}
                          alt="Payment QR"
                          className="h-52 w-52 rounded-xl border border-indigo-100 object-contain bg-white p-2 shadow-sm"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">QR code is not available.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              Your owner has not set up payment details. Please contact your owner directly.
            </div>
          )}

          <form onSubmit={submitPayment} className="space-y-3 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID <span className="text-rose-500">*</span></label>
              <input
                required
                type="text"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                className="input-field"
                placeholder="UPI / Bank transaction reference"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                required
                type="date"
                value={paymentForm.paidDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="input-field"
                placeholder="Any extra details"
              />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setPayModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submittingPayment} className="btn-primary inline-flex items-center gap-2">
                <Send size={14} /> {submittingPayment ? "Submitting…" : "Submit Payment Details"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default TenantRent;

