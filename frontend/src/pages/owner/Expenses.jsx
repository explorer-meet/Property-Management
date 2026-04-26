import React, { useEffect, useState, useCallback } from "react";
import {
  Receipt, Plus, Pencil, Trash2, TrendingDown, TrendingUp, Wallet,
  Building2, CalendarDays, Filter, X, ChevronDown,
} from "lucide-react";
import { PageHeader, Modal, EmptyState, StatCard } from "../../components/UI";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/currency";
import toast from "react-hot-toast";

const CATEGORIES = ["Repair", "Maintenance", "Tax", "Insurance", "Utility", "Legal", "Advertising", "Other"];

const CATEGORY_COLORS = {
  Repair: "bg-red-100 text-red-700",
  Maintenance: "bg-amber-100 text-amber-700",
  Tax: "bg-purple-100 text-purple-700",
  Insurance: "bg-blue-100 text-blue-700",
  Utility: "bg-teal-100 text-teal-700",
  Legal: "bg-indigo-100 text-indigo-700",
  Advertising: "bg-pink-100 text-pink-700",
  Other: "bg-gray-100 text-gray-600",
};

const BLANK_FORM = { propertyId: "", category: "Repair", title: "", amount: "", date: "", notes: "" };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState({ totalExpenses: 0, totalRentCollected: 0, netIncome: 0, categoryTotals: {} });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProperty, setFilterProperty] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFY, setFilterFY] = useState("");

  // Modal
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProperties = useCallback(async () => {
    try {
      const { data } = await api.get("/owner/properties");
      setProperties(data.properties || []);
    } catch { /* silent */ }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProperty) params.set("propertyId", filterProperty);
      if (filterCategory) params.set("category", filterCategory);
      if (filterFY) params.set("financialYear", filterFY);
      const { data } = await api.get(`/owner/expenses?${params}`);
      setExpenses(data.expenses || []);
      setSummary({
        totalExpenses: data.totalExpenses || 0,
        totalRentCollected: data.totalRentCollected || 0,
        netIncome: data.netIncome || 0,
        categoryTotals: data.categoryTotals || {},
      });
    } catch {
      toast.error("Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [filterProperty, filterCategory, filterFY]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setModal(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      propertyId: expense.property?._id || "",
      category: expense.category,
      title: expense.title,
      amount: String(expense.amount),
      date: expense.date ? expense.date.slice(0, 10) : "",
      notes: expense.notes || "",
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/owner/expenses/${editing._id}`, {
          category: form.category,
          title: form.title,
          amount: form.amount,
          date: form.date,
          notes: form.notes,
        });
        toast.success("Expense updated.");
      } else {
        await api.post("/owner/expenses", form);
        toast.success("Expense added.");
      }
      setModal(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/owner/expenses/${id}`);
      toast.success("Expense deleted.");
      setDeleteConfirm(null);
      fetchExpenses();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  // Build financial year options (last 5 FYs)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
  const fyOptions = Array.from({ length: 5 }, (_, i) => {
    const start = currentFYStart - i;
    return `${start}-${String(start + 1).slice(2)}`;
  });

  const netIncomeColor = summary.netIncome >= 0 ? "green" : "red";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracker"
        subtitle="Log property expenses and track net income"
        action={
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Rent Collected" value={formatCurrency(summary.totalRentCollected)} icon={TrendingUp} color="green" subtitle="All paid rent" />
        <StatCard title="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} color="red" subtitle="All logged expenses" />
        <StatCard title="Net Income" value={formatCurrency(summary.netIncome)} icon={Wallet} color={netIncomeColor} subtitle="Rent − Expenses" />
      </div>

      {/* Category Breakdown */}
      {Object.keys(summary.categoryTotals).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Expenses by Category</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.categoryTotals).map(([cat, total]) => (
              <span key={cat} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600"}`}>
                {cat}: {formatCurrency(total)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</label>
          <select value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.propertyType} - {p.address?.city}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Financial Year</label>
          <select value={filterFY} onChange={(e) => setFilterFY(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All Years</option>
            {fyOptions.map((fy) => <option key={fy} value={fy}>FY {fy}</option>)}
          </select>
        </div>
        {(filterProperty || filterCategory || filterFY) && (
          <button onClick={() => { setFilterProperty(""); setFilterCategory(""); setFilterFY(""); }} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading expenses…</div>
      ) : expenses.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses yet" subtitle="Add your first expense to start tracking net income." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Property</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">FY</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {e.title}
                      {e.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{e.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[e.category] || "bg-gray-100 text-gray-600"}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {e.property ? `${e.property.propertyType} - ${e.property.address?.city || ""}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 whitespace-nowrap">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{e.financialYear || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(e._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Property *</label>
              <select required value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>{p.propertyType} - {p.address?.city}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input type="text" required maxLength={200} placeholder="e.g. Water pipe repair" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹) *</label>
            <input type="number" required min="1" step="0.01" placeholder="0.00" value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
            <textarea rows={2} placeholder="Optional notes…" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Expense">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this expense? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
