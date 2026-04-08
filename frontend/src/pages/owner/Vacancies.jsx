import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { PageHeader, EmptyState } from "../../components/UI";
import api from "../../utils/api";
import toast from "react-hot-toast";

const Vacancies = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchVacancies = async () => {
    try {
      const { data } = await api.get("/owner/vacancies");
      setProperties(data.properties);
    } catch {
      toast.error("Failed to load vacancies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVacancies(); }, []);

  const markOccupied = async (id) => {
    setUpdating(id);
    try {
      await api.patch(`/owner/properties/${id}/status`, { status: "Occupied" });
      toast.success("Property marked as Occupied.");
      fetchVacancies();
    } catch {
      toast.error("Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Vacancies"
        subtitle="Properties currently available for rent"
      />

      {properties.length === 0 ? (
        <div className="card text-center py-16">
          <MapPin size={48} className="mx-auto text-green-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No Vacant Properties</p>
          <p className="text-gray-400 text-sm mt-1">All your properties are occupied.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p._id} className="card border-l-4 border-l-yellow-400">
              <div className="mb-3">
                <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">Vacant</span>
              </div>
              <h3 className="font-semibold text-gray-900">{p.propertyType}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {p.address.street}, {p.address.city}, {p.address.state}
                {p.address.pincode ? ` - ${p.address.pincode}` : ""}
              </p>
              {p.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>}
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-medium">{p.numberOfRooms}</span> room{p.numberOfRooms !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => markOccupied(p._id)}
                  disabled={updating === p._id}
                  className="btn-secondary text-sm py-1.5 w-full"
                >
                  {updating === p._id ? "Updating..." : "Mark as Occupied"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vacancies;
