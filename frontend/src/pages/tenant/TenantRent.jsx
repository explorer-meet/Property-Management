import React, { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const TenantRent = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/tenant/rent-history");
        setRents(data.rents);
      } catch {
        toast.error("Failed to load rent history.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const pending = rents.filter((r) => r.status === "Pending").length;
  const overdue = rents.filter((r) => r.status === "Overdue").length;
  const paid = rents.filter((r) => r.status === "Paid").length;

  return (
    <div>
      <PageHeader title="Rent & Payments" subtitle="Your rent records and payment history" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{paid}</p>
          <p className="text-sm text-gray-500">Paid</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{overdue}</p>
          <p className="text-sm text-gray-500">Overdue</p>
        </div>
      </div>

      {rents.length === 0 ? (
        <EmptyState message="No rent records yet." icon={DollarSign} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Month / Year</th>
                <th className="px-4 py-3 font-medium text-gray-600">Property</th>
                <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Paid Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rents.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.month} {r.year}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.property?.propertyType} — {r.property?.address?.city}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{r.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.paidDate ? new Date(r.paidDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TenantRent;
