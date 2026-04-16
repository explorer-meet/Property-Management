import React, { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/UI";
import api from "../../utils/api";

const statusClass = (status) => {
  if (status === "Closed") return "border-gray-200 bg-gray-100 text-gray-700";
  if (status === "Contacted") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "In Progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const TenantInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await api.get("/tenant/inquiries");
        setInquiries(data?.inquiries || []);
      } catch {
        toast.error("Failed to load inquiries.");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Inquiries"
        subtitle="Track the latest status of properties you showed interest in"
      />

      <section className="rounded-2xl border border-gray-100 bg-white/95 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageCircle size={18} className="text-cyan-600" /> Property Inquiry History
          </h3>
          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">{inquiries.length} total</span>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">Loading inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">You have not sent any inquiry yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {inquiries.map((inquiry) => (
              <div key={inquiry._id} className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-cyan-50/40 p-3.5 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {inquiry.property?.propertyType || "Property"} - {inquiry.property?.address?.city || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">Owner: {inquiry.owner?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">Email: {inquiry.owner?.email || "N/A"}</p>
                    <p className="text-xs text-gray-500 inline-flex items-center gap-1"><Phone size={12} /> {inquiry.owner?.phone || "N/A"}</p>
                    {inquiry.message ? (
                      <p className="mt-2 rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-1.5 text-xs text-cyan-700">
                        {inquiry.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500">Sent on {new Date(inquiry.createdAt).toLocaleString()}</p>
                    <span className={`inline-flex w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusClass(inquiry.status || "New")}`}>
                      {inquiry.status || "New"}
                    </span>
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

export default TenantInquiries;
