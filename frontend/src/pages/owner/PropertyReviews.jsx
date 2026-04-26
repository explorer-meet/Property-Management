import React, { useEffect, useState, useCallback } from "react";
import {
  Star, MessageSquare, Building2, ThumbsUp, ThumbsDown,
  CornerDownRight, Trash2, ChevronDown,
} from "lucide-react";
import { PageHeader, Modal, EmptyState, StatCard } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const StarDisplay = ({ value, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={size} className={s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
    ))}
  </div>
);

const RatingBar = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="w-24 text-xs text-gray-500 shrink-0">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
    </div>
    <span className="w-6 text-xs font-semibold text-gray-700">{Number(value).toFixed(1)}</span>
  </div>
);

export default function PropertyReviews() {
  const [reviews, setReviews] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProperty, setFilterProperty] = useState("");

  // Reply modal
  const [replyModal, setReplyModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/owner/reviews");
      setReviews(data.reviews || []);
      setSummaries(data.propertySummaries || []);
    } catch {
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const openReply = (review) => {
    setReplyTarget(review);
    setReplyText(review.ownerReply || "");
    setReplyModal(true);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/owner/reviews/${replyTarget._id}/reply`, { reply: replyText });
      toast.success("Reply saved.");
      setReplyModal(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save reply.");
    } finally {
      setSaving(false);
    }
  };

  const uniqueProperties = [...new Map(
    reviews.map((r) => [String(r.property?._id), r.property])
  ).values()].filter(Boolean);

  const filteredReviews = filterProperty
    ? reviews.filter((r) => String(r.property?._id) === filterProperty)
    : reviews;

  const overallAvg = reviews.length
    ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Reviews"
        subtitle="Tenant feedback and ratings for your properties"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Reviews" value={String(reviews.length)} icon={MessageSquare} color="blue" />
        <StatCard title="Overall Rating" value={overallAvg ? `${overallAvg} / 5` : "—"} icon={Star} color="yellow" />
        <StatCard title="Properties Reviewed" value={String(summaries.length)} icon={Building2} color="green" />
      </div>

      {/* Per-property summary */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Ratings by Property</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summaries.map((s) => (
              <div key={String(s.property?._id)} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {s.property?.propertyType} — {s.property?.address?.city}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StarDisplay value={parseFloat(s.avgOverallRating)} />
                  <span className="text-xs font-bold text-amber-600">{s.avgOverallRating}</span>
                  <span className="text-xs text-gray-400">({s.reviewCount} review{s.reviewCount !== 1 ? "s" : ""})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      {uniqueProperties.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Property</label>
          <select value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">All Properties</option>
            {uniqueProperties.map((p) => (
              <option key={p._id} value={p._id}>{p.propertyType} - {p.address?.city}</option>
            ))}
          </select>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reviews…</div>
      ) : filteredReviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" subtitle="Reviews from tenants will appear here after they submit feedback." />
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarDisplay value={review.overallRating} size={16} />
                    <span className="text-base font-bold text-gray-800">{review.overallRating}/5</span>
                    {review.title && <span className="text-sm font-semibold text-gray-700">— {review.title}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    by <span className="font-semibold text-gray-600">{review.tenant?.name || "Tenant"}</span>
                    {" · "}
                    {review.property ? `${review.property.propertyType} - ${review.property.address?.city}` : ""}
                    {" · "}
                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <button onClick={() => openReply(review)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shrink-0">
                  <CornerDownRight size={12} /> {review.ownerReply ? "Edit Reply" : "Reply"}
                </button>
              </div>

              {/* Sub-ratings */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <RatingBar label="Maintenance" value={review.maintenanceRating} />
                <RatingBar label="Location" value={review.locationRating} />
                <RatingBar label="Value" value={review.valueRating} />
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}

              {/* Pros / Cons */}
              {(review.pros || review.cons) && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {review.pros && (
                    <div className="flex items-start gap-2 bg-green-50 rounded-xl p-3">
                      <ThumbsUp size={14} className="text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-0.5">Pros</p>
                        <p className="text-xs text-green-800">{review.pros}</p>
                      </div>
                    </div>
                  )}
                  {review.cons && (
                    <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                      <ThumbsDown size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-0.5">Cons</p>
                        <p className="text-xs text-red-700">{review.cons}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Owner reply */}
              {review.ownerReply && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                  <CornerDownRight size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Your Reply</p>
                    <p className="text-xs text-blue-800">{review.ownerReply}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <Modal isOpen={replyModal} onClose={() => setReplyModal(false)} title="Reply to Review">
        {replyTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <StarDisplay value={replyTarget.overallRating} />
                <span className="text-sm font-semibold text-gray-700">{replyTarget.tenant?.name}</span>
              </div>
              {replyTarget.comment && <p className="text-sm text-gray-600">{replyTarget.comment}</p>}
            </div>
            <form onSubmit={handleReply} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Reply *</label>
                <textarea rows={4} required value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={600}
                  placeholder="Thank the tenant and address any concerns professionally…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReplyModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50">
                  {saving ? "Saving…" : "Save Reply"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
