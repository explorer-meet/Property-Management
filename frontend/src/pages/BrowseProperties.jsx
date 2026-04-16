import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Home, MapPin, Search, SlidersHorizontal, Menu, X } from "lucide-react";
import api from "../utils/api";
import toast from "react-hot-toast";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("pms_user") || "null");
  } catch {
    return null;
  }
};

const propertyImage = (type) => {
  if (type === "Flat") return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80";
  if (type === "Office") return "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80";
  if (type === "Shop") return "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=900&q=80";
  if (type === "Villa") return "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80";
  if (type === "House") return "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80";
  return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80";
};

const BrowseProperties = () => {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState(() => getStoredUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicProperties, setPublicProperties] = useState([]);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState("All");
  const [submittingInquiryId, setSubmittingInquiryId] = useState("");

  const isLoggedIn = Boolean(authUser) && Boolean(localStorage.getItem("pms_token"));
  const dashboardPath = authUser?.role === "owner" ? "/owner/dashboard" : "/tenant/dashboard";

  useEffect(() => {
    const syncAuthUser = () => setAuthUser(getStoredUser());
    window.addEventListener("storage", syncAuthUser);
    return () => window.removeEventListener("storage", syncAuthUser);
  }, []);

  useEffect(() => {
    const fetchPublicProperties = async () => {
      try {
        const { data } = await api.get("/properties/public");
        setPublicProperties(data?.properties || []);
      } catch {
        toast.error("Unable to load properties right now.");
      } finally {
        setPropertyLoading(false);
      }
    };

    fetchPublicProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return publicProperties.filter((property) => {
      const isVacant = property?.status === "Vacant";
      if (!isVacant) return false;

      const matchesType = searchType === "All" || property.propertyType === searchType;
      const location = `${property?.address?.street || ""} ${property?.address?.city || ""} ${property?.address?.state || ""}`.toLowerCase();
      const matchesCity = !searchCity.trim() || location.includes(searchCity.trim().toLowerCase());
      return matchesType && matchesCity;
    });
  }, [publicProperties, searchCity, searchType]);

  const handleInterested = async (property) => {
    const token = localStorage.getItem("pms_token");
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem("pms_user") || "null");
    } catch {
      user = null;
    }

    const pendingPayload = {
      propertyId: property._id,
      message: `I am interested in your ${property.propertyType} listing in ${property?.address?.city || "this area"}.`,
      savedAt: new Date().toISOString(),
    };

    if (!token || !user) {
      localStorage.setItem("pendingPropertyInquiry", JSON.stringify(pendingPayload));
      toast.error("Please login or register to send an inquiry.");
      return;
    }

    try {
      setSubmittingInquiryId(property._id);
      await api.post(`/properties/${property._id}/inquiries`, { message: pendingPayload.message });
      toast.success("Inquiry sent to property owner.");
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Unable to submit inquiry.";
      toast.error(errorMessage);
    } finally {
      setSubmittingInquiryId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 overflow-x-hidden">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-xl shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">PropManager</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-blue-100/80 bg-white/85 px-2 py-1 shadow-[0_10px_28px_rgba(37,99,235,0.14)] backdrop-blur">
            <Link to="/" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:text-blue-700 hover:bg-blue-50">
              Home
            </Link>
            <a href="#catalog" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:text-blue-700 hover:bg-blue-50">
              Properties
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => navigate(dashboardPath)}
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Home size={14} /> Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Home</Link>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-gray-700 py-2">Properties</a>
            <div className="flex gap-3 pt-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    navigate(dashboardPath);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 text-center bg-blue-600 text-sm font-semibold text-white py-2 rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <Home size={14} /> Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="flex-1 text-center border border-gray-200 text-sm font-medium text-gray-700 py-2 rounded-lg">Sign In</Link>
                  <Link to="/register" className="flex-1 text-center bg-blue-600 text-sm font-semibold text-white py-2 rounded-lg">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-14 sm:pb-16">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-200/60">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-blue-100 font-semibold">Public Property Catalogue</p>
          <h1 className="text-2xl sm:text-4xl font-extrabold mt-2">Find the right property with smart filters</h1>
          <p className="text-blue-100 mt-3 text-sm sm:text-base max-w-3xl">
            Search by location and filter by property type to view all current vacant listings from verified owners.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-[0_12px_35px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <SlidersHorizontal size={16} className="text-blue-600" />
            Filter properties
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search by city, state, or street"
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              <option value="All">All property types</option>
              <option value="Home">Home</option>
              <option value="Flat">Flat</option>
              <option value="Office">Office</option>
              <option value="Shop">Shop</option>
              <option value="Villa">Villa</option>
              <option value="House">House</option>
            </select>
          </div>
        </section>

        <section className="mt-6">
          {propertyLoading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">No properties match your filters right now.</div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">Showing {filteredProperties.length} vacant properties</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProperties.map((property) => (
                  <div key={property._id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                    <img src={propertyImage(property.propertyType)} alt={property.propertyType} className="w-full h-48 object-cover" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{property.propertyType}</p>
                          <h3 className="text-lg font-bold text-gray-900 mt-1">
                            {property?.address?.city || "Unknown city"}, {property?.address?.state || "Unknown state"}
                          </h3>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                          Vacant
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {property?.description || "No description provided by owner yet."}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                        <p className="flex items-center gap-1.5"><MapPin size={13} className="text-blue-500" /> {property?.address?.street || "Address not available"}</p>
                        <p>Rooms: <span className="font-semibold text-gray-800">{property.numberOfRooms || 1}</span></p>
                        <p>Listed by: <span className="font-semibold text-gray-800">{property?.owner?.name || "Owner"}</span></p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInterested(property)}
                        disabled={submittingInquiryId === property._id}
                        className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
                      >
                        {submittingInquiryId === property._id ? "Submitting..." : "Interested"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm">PropManager</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} PropManager. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            {!isLoggedIn && (
              <>
                <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrowseProperties;
