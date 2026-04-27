import React, { useEffect, useState } from "react";
import { CalendarDays, Home, Landmark, UserCircle2, Wallet } from "lucide-react";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function TenantLeases() {
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState([]);

  useEffect(() => {
    const fetchLease = async () => {
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

    fetchLease();
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Leases"
          value={leases.length}
          subtitle="Currently active agreements"
          icon={Home}
          color="green"
        />
        <StatCard
          title="Total Monthly Rent"
          value={formatCurrency(totalMonthlyRent)}
          subtitle="Across all active leases"
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Next Lease End"
          value={formatDate(latestLeaseEnd)}
          subtitle={`${maxDaysLeft} day(s) remaining`}
          icon={CalendarDays}
          color="yellow"
        />
        <StatCard
          title="Combined Deposit"
          value={formatCurrency(leases.reduce((sum, item) => sum + Number(item.securityDeposit || 0), 0))}
          subtitle="Refundable as per lease terms"
          icon={Landmark}
          color="purple"
        />
      </div>

      <div className="space-y-4">
        {leases.map((lease) => {
          const daysLeft = lease?.leaseEndDate
            ? Math.max(0, Math.ceil((new Date(lease.leaseEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
            : 0;

          return (
            <div key={lease._id} className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {lease.property?.address?.society || "Property"} / {lease.property?.propertyType || "Home"}
                </h2>
                <StatusBadge status={lease.isActive ? "Active" : "Inactive"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Property</p>
                  <p className="text-gray-900 font-semibold mt-1">{lease.property?.propertyType || "Property"}</p>
                  <p className="text-gray-600 mt-1">
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

                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Owner Contact</p>
                  <p className="text-gray-900 font-semibold mt-1 inline-flex items-center gap-1.5">
                    <UserCircle2 size={14} className="text-gray-500" />
                    {lease.owner?.name || "Owner"}
                  </p>
                  <p className="text-gray-600 mt-1">{lease.owner?.email || "Email not available"}</p>
                  <p className="text-gray-600 mt-1">{lease.owner?.phone || "Phone not available"}</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Lease Duration</p>
                  <p className="text-gray-900 font-semibold mt-1">{formatDate(lease.leaseStartDate)} to {formatDate(lease.leaseEndDate)}</p>
                  <p className="text-gray-600 mt-1">{daysLeft} day(s) remaining</p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-gray-500">Financial Terms</p>
                  <p className="text-gray-900 font-semibold mt-1">Rent: {formatCurrency(lease.rentAmount || 0)}</p>
                  <p className="text-gray-600 mt-1">Deposit: {formatCurrency(lease.securityDeposit || 0)}</p>
                  <p className="text-gray-600 mt-1">Due day: {lease.rentDueDay || 1}, grace: {lease.graceDays || 0} day(s)</p>
                  <p className="text-gray-600 mt-1">
                    Late fee: {lease.lateFeeType === "percent"
                      ? `${Number(lease.lateFeeValue || 0)}% of rent`
                      : `${formatCurrency(lease.lateFeeValue || 0)} fixed`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}