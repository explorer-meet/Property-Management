import React, { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/UI";
import api from "../../utils/api";

const STATUS_OPTIONS = ["In Progress", "Contacted", "Closed"];

const OwnerInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingInquiryId, setUpdatingInquiryId] = useState("");

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await api.get("/owner/inquiries");
        setInquiries(data?.inquiries || []);
      } catch {
        toast.error("Failed to load inquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const updateStatus = async (inquiryId, status) => {
    try {
      setUpdatingInquiryId(inquiryId);
      await api.patch(`/owner/inquiries/${inquiryId}/status`, { status });
      setInquiries((prev) => prev.map((item) => (item._id === inquiryId ? { ...item, status } : item)));
      toast.success("Inquiry status updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update inquiry status.");
    } finally {
      setUpdatingInquiryId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Inquiries"
        subtitle="Track interested users and manage inquiry progress"
      />

      <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={18} className="text-blue-600" /> All Inquiries
          </h3>
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">{inquiries.length} total</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">No inquiries received yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-3.5 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {inquiry.property?.propertyType || "Property"} - {inquiry.property?.address?.city || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Inquirer: {inquiry.inquirer?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Email: {inquiry.inquirer?.email || "N/A"}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.inquirer?.phone || "N/A"}</p>
                    {inquiry.message ? (
                      <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
                        {inquiry.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500">Received on {new Date(inquiry.createdAt).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={inquiry.status || "New"}
                        onChange={(e) => updateStatus(inquiry._id, e.target.value)}
                        disabled={updatingInquiryId === inquiry._id}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
                      >
                        <option value="New">New</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerInquiries;
