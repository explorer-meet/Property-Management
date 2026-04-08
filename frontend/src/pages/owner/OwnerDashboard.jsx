import React, { useEffect, useState } from "react";
import { Building2, Users, DollarSign, Wrench, MapPin, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard, PageHeader } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/owner/dashboard");
        setStats(data.stats);
      } catch {
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;

  const pieData = stats
    ? [
        { name: "Occupied", value: stats.occupiedProperties },
        { name: "Vacant", value: stats.vacantProperties },
      ]
    : [];

  const rentData = stats
    ? [
        { name: "Paid", value: stats.totalPaidAmount, fill: "#10b981" },
        { name: "Pending", value: stats.pendingRent, fill: "#f59e0b" },
        { name: "Overdue", value: stats.overdueRent, fill: "#ef4444" },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your properties."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Properties" value={stats?.totalProperties || 0} icon={Building2} color="blue" />
        <StatCard title="Active Leases" value={stats?.activeLeases || 0} icon={Users} color="green" />
        <StatCard title="Pending Rent" value={stats?.pendingRent || 0} icon={DollarSign} color="yellow" />
        <StatCard title="Open Requests" value={stats?.openMaintenanceRequests || 0} icon={Wrench} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Occupied" value={stats?.occupiedProperties || 0} icon={Building2} color="purple" />
        <StatCard title="Vacant" value={stats?.vacantProperties || 0} icon={MapPin} color="gray" />
        <StatCard title="Overdue Rent" value={stats?.overdueRent || 0} icon={DollarSign} color="red" />
        <StatCard
          title="Total Collected"
          value={`₹${(stats?.totalPaidAmount || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Occupancy Status</h3>
          {pieData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No property data yet.</p>
          )}
        </div>

        {/* Rent Status Chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Rent Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {rentData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
