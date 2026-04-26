import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart2, TrendingUp, TrendingDown, Building2, Download,
  Wallet, CalendarDays, PieChart, Activity,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend,
} from "recharts";
import { PageHeader, StatCard } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const MONTH_ABBR = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const MONTH_FULL = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

const formatINR = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const resolveMonthNumber = (value) => {
  if (typeof value === "number" && value >= 1 && value <= 12) return value;
  if (typeof value !== "string") return 0;

  const trimmed = value.trim();
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 12) return asNumber;

  if (MONTH_FULL[trimmed]) return MONTH_FULL[trimmed];
  const abbr = trimmed.slice(0, 3);
  return MONTH_ABBR[abbr] || 0;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function AdvancedAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // FY options
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
  const fyOptions = Array.from({ length: 5 }, (_, i) => {
    const start = currentFYStart - i;
    return `${start}-${String(start + 1).slice(2)}`;
  });
  const [selectedFY, setSelectedFY] = useState(fyOptions[0]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/owner/advanced-analytics?financialYear=${selectedFY}`);
      setData(res);
    } catch {
      toast.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [selectedFY]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleDownloadTaxReport = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("pms_token");
      const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api");
      const response = await fetch(`${baseUrl}/owner/tax-report/download?financialYear=${selectedFY}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-report-FY${selectedFY}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Tax report downloaded.");
    } catch {
      toast.error("Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  // Build monthly chart data (all 12 months of FY, Apr to Mar)
  const buildMonthlyChartData = () => {
    if (!data) return [];
    const fyStartYear = parseInt(selectedFY.split("-")[0], 10);
    // months: Apr(4)..Dec(12) of fyStartYear, then Jan(1)..Mar(3) of fyStartYear+1
    const months = [
      { m: 4, y: fyStartYear }, { m: 5, y: fyStartYear }, { m: 6, y: fyStartYear },
      { m: 7, y: fyStartYear }, { m: 8, y: fyStartYear }, { m: 9, y: fyStartYear },
      { m: 10, y: fyStartYear }, { m: 11, y: fyStartYear }, { m: 12, y: fyStartYear },
      { m: 1, y: fyStartYear + 1 }, { m: 2, y: fyStartYear + 1 }, { m: 3, y: fyStartYear + 1 },
    ];

    const rentMap = {};
    (data.monthlyRent || []).forEach((r) => {
      const monthNum = resolveMonthNumber(r?._id?.month);
      const yearNum = Number(r?._id?.year || 0);
      if (!monthNum || !yearNum) return;
      const key = `${monthNum}-${yearNum}`;
      rentMap[key] = Number(r.total || 0);
    });

    const expMap = {};
    (data.monthlyExpenses || []).forEach((e) => {
      const key = `${e._id.month}-${e._id.year}`;
      expMap[key] = e.total;
    });

    return months.map(({ m, y }) => ({
      name: `${MONTH_NAMES[m - 1]} ${String(y).slice(2)}`,
      Income: rentMap[`${m}-${y}`] || 0,
      Expenses: expMap[`${m}-${y}`] || 0,
    }));
  };

  const monthlyData = buildMonthlyChartData();

  const pieData = (data?.expensesByCategory || []).map((c) => ({
    name: c._id,
    value: c.total,
  }));

  const maintenanceData = (data?.maintenanceByCategory || []).map((c) => ({
    name: c._id,
    count: c.count,
  }));

  const occupancyRows = (data?.occupancyData || []).map((p) => {
    const monthsOccupied = Number(p.monthsOccupied || 0);
    const monthsVacant = Math.max(0, 12 - monthsOccupied);
    const pct = Math.round((monthsOccupied / 12) * 100);

    let tone = "bg-rose-50 text-rose-700 border-rose-200";
    if (pct >= 80) tone = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (pct >= 50) tone = "bg-amber-50 text-amber-700 border-amber-200";

    return {
      ...p,
      monthsOccupied,
      monthsVacant,
      pct,
      tone,
    };
  });

  const avgOccupancy = occupancyRows.length
    ? Math.round(occupancyRows.reduce((sum, row) => sum + row.pct, 0) / occupancyRows.length)
    : 0;
  const fullOccupiedCount = occupancyRows.filter((row) => row.pct === 100).length;
  const lowOccupiedCount = occupancyRows.filter((row) => row.pct < 50).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Advanced Analytics" subtitle="Financial insights and tax reports" />
        <div className="text-center py-24 text-gray-400">Loading analytics…</div>
      </div>
    );
  }

  const stmt = data?.incomeStatement || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics"
        subtitle="Financial insights and ITR-ready tax reports"
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {fyOptions.map((fy) => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
            <button
              onClick={handleDownloadTaxReport}
              disabled={downloading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Download size={15} />
              {downloading ? "Generating…" : "Download Tax Report"}
            </button>
          </div>
        }
      />

      {/* Income Statement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Rent Income" value={formatCurrency(stmt.totalRentIncome || 0)} icon={TrendingUp} color="green" subtitle={`FY ${data?.financialYear}`} />
        <StatCard title="Late Fees Collected" value={formatCurrency(stmt.totalLateFees || 0)} icon={Wallet} color="blue" />
        <StatCard title="Total Expenses" value={formatCurrency(stmt.totalExpenses || 0)} icon={TrendingDown} color="red" />
        <StatCard
          title="Net Profit"
          value={formatCurrency(stmt.netProfit || 0)}
          icon={BarChart2}
          color={stmt.netProfit >= 0 ? "green" : "red"}
          subtitle="Income + Fees − Expenses"
        />
      </div>

      {/* Monthly Income vs Expenses Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          Monthly Income vs Expenses — FY {data?.financialYear}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-purple-500" />
            Expenses by Category
          </h3>
          {pieData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No expenses this FY</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => formatINR(val)} />
              </RPieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Maintenance Requests by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-500" />
            Maintenance Requests by Category
          </h3>
          {maintenanceData.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No maintenance requests this FY</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={maintenanceData} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Occupancy Summary */}
      {data?.occupancyData?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Building2 size={16} className="text-teal-500" />
            Property Occupancy — FY {data?.financialYear}
          </h3>
          <p className="text-xs text-gray-500 mb-4">Occupancy % means how many months in this financial year the property had paid occupancy.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-sky-700">Average Occupancy</p>
              <p className="text-xl font-bold text-sky-900 mt-0.5">{avgOccupancy}%</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700">Fully Occupied</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{fullOccupiedCount} properties</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-rose-700">Needs Attention</p>
              <p className="text-xl font-bold text-rose-900 mt-0.5">{lowOccupiedCount} properties</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {occupancyRows.map((p) => (
              <div key={p.propertyId} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 leading-5">{p.label}</p>
                  <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg border ${p.tone}`}>
                    {p.pct}% occupied
                  </span>
                </div>

                <div className="mt-3 h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-2.5 rounded-full bg-teal-500 transition-all" style={{ width: `${p.pct}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-emerald-700 font-medium">Occupied: {p.monthsOccupied} / 12 months</div>
                  <div className="text-gray-500">Vacant: {p.monthsVacant} months</div>
                </div>

                <div className="mt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.currentStatus === "Occupied" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    Current Status: {p.currentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Report Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <CalendarDays size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">ITR Filing Reminder</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Download your Tax Report PDF (FY {data?.financialYear}) to share with your Chartered Accountant for income tax filing (Schedule HP — Income from House Property).
            Gross Rent: {formatCurrency(stmt.totalRentIncome || 0)} | Deductible Expenses: {formatCurrency(stmt.totalExpenses || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
