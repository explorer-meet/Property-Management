import React, { useEffect, useState, useCallback } from "react";
import { Star, Send, Trash2, Building2, MessageSquare, ThumbsUp, ThumbsDown, CornerDownRight, Pencil } from "lucide-react";
import { PageHeader, Modal, EmptyState, StatCard } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const StarPicker = ({ value, onChange, size = 24 }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button type="button" key={s} onClick={() => onChange(s)}
        className="p-0.5 hover:scale-110 transition-transform">
        <Star size={size} className={s <= value ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-100"} />
      </button>
    ))}
  </div>
);

const StarDisplay = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={size} className={s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
    ))}
  </div>
);

const BLANK_FORM = {
  overallRating: 0, maintenanceRating: 0, locationRating: 0, valueRating: 0,
  title: "", comment: "", pros: "", cons: "",
};

export default function TenantReview() {
  const [reviews, setReviews] = useState([]);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(BLANK_FORM);
  const [editSaving, setEditSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, leaseRes] = await Promise.allSettled([
        api.get("/tenant/reviews"),
        api.get("/tenant/lease"),
      ]);
      if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value.data.reviews || []);
      if (leaseRes.status === "fulfilled") setLease(leaseRes.value.data.lease || null);
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasReviewedCurrentProperty = lease
    ? reviews.some((r) => String(r.property?._id) === String(lease.property?._id))
    : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lease) return toast.error("No active lease found.");
    if (form.overallRating === 0 || form.maintenanceRating === 0 || form.locationRating === 0 || form.valueRating === 0) {
      return toast.error("Please provide all four ratings.");
    }
    setSaving(true);
    try {
      await api.post("/tenant/reviews", {
        propertyId: lease.property?._id,
        ...form,
      });
      toast.success("Review submitted! Thank you.");
      setModal(false);
      setForm(BLANK_FORM);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tenant/reviews/${id}`);
      toast.success("Review deleted.");
      setDeleteConfirm(null);
      fetchData();
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  const setRating = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const openEditModal = (review) => {
    setEditTarget(review);
    setEditForm({
      overallRating: review.overallRating || 0,
      maintenanceRating: review.maintenanceRating || 0,
      locationRating: review.locationRating || 0,
      valueRating: review.valueRating || 0,
      title: review.title || "",
      comment: review.comment || "",
      pros: review.pros || "",
      cons: review.cons || "",
    });
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    if (editForm.overallRating === 0 || editForm.maintenanceRating === 0 || editForm.locationRating === 0 || editForm.valueRating === 0) {
      return toast.error("Please provide all four ratings.");
    }
    setEditSaving(true);
    try {
      await api.patch(`/tenant/reviews/${editTarget._id}`, editForm);
      toast.success("Review updated successfully!");
      setEditModal(false);
      setEditTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review.");
    } finally {
      setEditSaving(false);
    }
  };

  const setEditRating = (field) => (val) => setEditForm((f) => ({ ...f, [field]: val }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reviews"
        subtitle="Rate and review your rental experience"
        action={
          lease && !hasReviewedCurrentProperty && (
            <button onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <Star size={15} /> Write a Review
            </button>
          )
        }
      />

      {/* Current property prompt */}
      {lease && !hasReviewedCurrentProperty && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <Star size={20} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Share your experience!</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You haven't reviewed{" "}
              <span className="font-semibold">{lease.property?.propertyType} — {lease.property?.address?.city}</span>{" "}
              yet. Your review helps other tenants and helps owners improve.
            </p>
          </div>
          <button onClick={() => setModal(true)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors">
            Rate Now
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" subtitle={lease ? "Write your first review for your current property." : "You don't have an active lease."} />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarDisplay value={review.overallRating} size={16} />
                    <span className="font-bold text-gray-800">{review.overallRating}/5</span>
                    {review.title && <span className="text-sm font-semibold text-gray-700">— {review.title}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {review.property ? `${review.property.propertyType} — ${review.property.address?.city}` : "Property"}
                    {" · "}
                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEditModal(review)}
                    className="p-1.5 rounded-lg text-amber-500 bg-amber-50 hover:text-amber-700 hover:bg-amber-100 transition-colors" title="Edit review">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(review._id)}
                    className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:text-red-700 hover:bg-red-100 transition-colors" title="Delete review">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Sub ratings */}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[["Maintenance", review.maintenanceRating], ["Location", review.locationRating], ["Value", review.valueRating]].map(([label, val]) => (
                  <div key={label} className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <StarDisplay value={val} size={12} />
                  </div>
                ))}
              </div>

              {review.comment && <p className="mt-3 text-sm text-gray-600">{review.comment}</p>}

              {(review.pros || review.cons) && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {review.pros && (
                    <div className="flex items-start gap-2 bg-green-50 rounded-xl p-3">
                      <ThumbsUp size={13} className="text-green-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-800">{review.pros}</p>
                    </div>
                  )}
                  {review.cons && (
                    <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                      <ThumbsDown size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-700">{review.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Owner reply */}
              {review.ownerReply && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                  <CornerDownRight size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Owner's Reply</p>
                    <p className="text-xs text-blue-800">{review.ownerReply}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Review Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Write a Review">
        {lease && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
              Reviewing: <span className="font-semibold text-gray-800">
                {lease.property?.propertyType} — {lease.property?.address?.city}
              </span>
            </div>

            {/* Ratings */}
            <div className="space-y-3">
              {[
                { label: "Overall Rating *", field: "overallRating" },
                { label: "Maintenance Quality *", field: "maintenanceRating" },
                { label: "Location *", field: "locationRating" },
                { label: "Value for Money *", field: "valueRating" },
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">{label}</label>
                  <StarPicker value={form[field]} onChange={setRating(field)} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Review Title</label>
              <input type="text" maxLength={150} placeholder="Sum up your experience in one line" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Review</label>
              <textarea rows={3} maxLength={1000} placeholder="Describe your overall experience living here…" value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ThumbsUp size={13} className="text-green-600" /> Pros
                </label>
                <textarea rows={2} maxLength={500} placeholder="What did you like?" value={form.pros}
                  onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ThumbsDown size={13} className="text-red-500" /> Cons
                </label>
                <textarea rows={2} maxLength={500} placeholder="What could be better?" value={form.cons}
                  onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50">
                <Send size={14} /> {saving ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </form>
        )}
        {!lease && (
          <p className="text-sm text-gray-600">You need an active lease to submit a review.</p>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Review">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this review? This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Delete</button>
        </div>
      </Modal>

      {/* Edit Review Modal */}
      <Modal isOpen={editModal} onClose={() => { setEditModal(false); setEditTarget(null); }} title="Edit Review">
        {editTarget && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
              Editing review for: <span className="font-semibold">
                {editTarget.property?.propertyType} — {editTarget.property?.address?.city}
              </span>
            </div>

            {/* Ratings */}
            <div className="space-y-3">
              {[
                { label: "Overall Rating *", field: "overallRating" },
                { label: "Maintenance Quality *", field: "maintenanceRating" },
                { label: "Location *", field: "locationRating" },
                { label: "Value for Money *", field: "valueRating" },
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">{label}</label>
                  <StarPicker value={editForm[field]} onChange={setEditRating(field)} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Review Title</label>
              <input type="text" maxLength={150} placeholder="Sum up your experience in one line" value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Detailed Review</label>
              <textarea rows={3} maxLength={1000} placeholder="Describe your overall experience living here…" value={editForm.comment}
                onChange={(e) => setEditForm((f) => ({ ...f, comment: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ThumbsUp size={13} className="text-green-600" /> Pros
                </label>
                <textarea rows={2} maxLength={500} placeholder="What did you like?" value={editForm.pros}
                  onChange={(e) => setEditForm((f) => ({ ...f, pros: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <ThumbsDown size={13} className="text-red-500" /> Cons
                </label>
                <textarea rows={2} maxLength={500} placeholder="What could be better?" value={editForm.cons}
                  onChange={(e) => setEditForm((f) => ({ ...f, cons: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setEditModal(false); setEditTarget(null); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={editSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50">
                <Pencil size={14} /> {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
