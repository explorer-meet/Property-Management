import React, { useEffect, useState } from "react";
import { Building2, DollarSign, Wrench, Calendar } from "lucide-react";
import { StatCard, PageHeader, StatusBadge } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const TenantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await api.get("/tenant/dashboard");
        setData(res);
      } catch {
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const lease = data?.lease;
  const stats = data?.stats;

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle="Overview of your tenancy details" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Pending Rent" value={stats?.pendingRent || 0} icon={DollarSign} color="yellow" />
        <StatCard title="Overdue Rent" value={stats?.overdueRent || 0} icon={DollarSign} color="red" />
        <StatCard title="Open Requests" value={stats?.openRequests || 0} icon={Wrench} color="blue" />
      </div>

      {lease ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg"><Building2 size={18} className="text-blue-600" /></div>
              <h3 className="font-semibold text-gray-900">My Property</h3>
              <StatusBadge status={lease.property?.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900">{lease.property?.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right">
                  {lease.property?.address?.street}, {lease.property?.address?.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rooms</span>
                <span className="font-medium text-gray-900">{lease.property?.numberOfRooms}</span>
              </div>
              {lease.property?.description && (
                <div>
                  <span className="text-gray-500">Description</span>
                  <p className="text-gray-700 mt-1">{lease.property.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lease Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-50 rounded-lg"><Calendar size={18} className="text-green-600" /></div>
              <h3 className="font-semibold text-gray-900">Lease Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Rent</span>
                <span className="font-semibold text-gray-900">₹{lease.rentAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security Deposit</span>
                <span className="font-medium text-gray-900">₹{lease.securityDeposit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rent Due Day</span>
                <span className="font-medium text-gray-900">{lease.rentDueDay} of every month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lease Start</span>
                <span className="font-medium text-gray-900">{new Date(lease.leaseStartDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lease End</span>
                <span className="font-medium text-gray-900">{new Date(lease.leaseEndDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500">Owner</span>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{lease.owner?.name}</p>
                  <p className="text-xs text-gray-400">{lease.owner?.email}</p>
                  {lease.owner?.phone && <p className="text-xs text-gray-400">{lease.owner?.phone}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No active lease found.</p>
          <p className="text-gray-400 text-sm mt-1">Contact your property owner to be assigned a lease.</p>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
