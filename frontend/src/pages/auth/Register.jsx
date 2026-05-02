import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  Building2, Eye, EyeOff, CheckCircle2,
  BarChart3, Shield, Bell,
} from "lucide-react";
import api from "../../utils/api";
import { setCredentials } from "../../app/slices/authSlice";

const PERKS = [
  { icon: BarChart3, text: "Rent and occupancy insights" },
  { icon: Bell, text: "Maintenance notifications" },
  { icon: Shield, text: "Secure role-based access" },
];

const COUNTRY_CODES = [
  { value: "+1", label: "US (+1)" },
  { value: "+44", label: "UK (+44)" },
  { value: "+61", label: "AU (+61)" },
  { value: "+65", label: "SG (+65)" },
  { value: "+91", label: "IN (+91)" },
  { value: "+971", label: "AE (+971)" },
];

const submitPendingInquiryIfAny = async () => {
  const rawPendingInquiry = localStorage.getItem("pendingPropertyInquiry");
  if (!rawPendingInquiry) return;

  try {
    const pendingInquiry = JSON.parse(rawPendingInquiry);
    if (!pendingInquiry?.propertyId) {
      localStorage.removeItem("pendingPropertyInquiry");
      return;
    }

    await api.post(`/properties/${pendingInquiry.propertyId}/inquiries`, {
      message: pendingInquiry.message || "I am interested in this property.",
    });
    localStorage.removeItem("pendingPropertyInquiry");
    toast.success("Your property inquiry has been submitted.");
  } catch (err) {
    const status = err?.response?.status;
    if ([400, 404, 409].includes(status)) {
      localStorage.removeItem("pendingPropertyInquiry");
      return;
    }
    toast.error("Registered successfully, but inquiry could not be submitted right now.");
  }
};

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "owner",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Password and confirm password must match.");
      return;
    }

    const cleanedPhone = (form.phone || "").replace(/\D/g, "");
    if (cleanedPhone.length < 6 || cleanedPhone.length > 15) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        phone: cleanedPhone,
      };
      const { data } = await api.post("/auth/signup", payload);
      dispatch(setCredentials({ user: data.user, token: data.token }));

      await submitPendingInquiryIfAny();

      toast.success("Registration successful!");
      navigate(data.user.role === "owner" ? "/owner/dashboard" : "/tenant/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[linear-gradient(135deg,#ecfeff_0%,#f8fafc_45%,#eef2ff_100%)] overflow-x-hidden lg:grid lg:min-h-screen lg:grid-cols-[0.92fr_1.08fr] lg:overflow-hidden">
      <div className="relative hidden lg:flex flex-col justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),linear-gradient(150deg,#082f49_0%,#0f766e_56%,#1d4ed8_100%)] px-10 py-10 xl:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />
        <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-1/3 translate-y-1/3 rounded-full bg-blue-300/18 blur-3xl" />

        <div className="relative max-w-md">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="p-2 rounded-2xl bg-white/15 border border-white/20 group-hover:bg-white/20 transition-colors">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg tracking-tight">PropManager</p>
              <p className="text-cyan-100/75 text-[11px] uppercase tracking-[0.2em]">Fast onboarding</p>
            </div>
          </Link>

          <h1 className="mt-8 text-3xl font-black leading-tight text-white xl:text-4xl">
            Create your account and get started quickly.
          </h1>
          <p className="mt-3 text-sm leading-6 text-cyan-50/85">
            Owners and tenants get secure access to listings, leases, rent, and maintenance workflows.
          </p>

          <ul className="mt-8 grid gap-3">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-sm text-cyan-50/90 backdrop-blur-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <Icon size={15} className="text-cyan-100" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-sm italic leading-6 text-cyan-50/90">
              &ldquo;The setup is simple and the dashboard is clear from day one.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-cyan-100/80">New PropManager user</p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-dvh items-start justify-center overflow-y-visible px-5 py-6 sm:px-8 sm:py-8 lg:h-full lg:min-h-0 lg:items-center lg:overflow-y-auto lg:px-10 lg:py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%)]" />

        <div className="relative w-full max-w-3xl">
          <div className="mb-4 flex items-center justify-end">
            <div className="lg:hidden inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700 shadow-sm">
              <Shield size={12} /> Guided
            </div>
          </div>

          <div className="lg:hidden mb-4 overflow-hidden rounded-[24px] bg-[linear-gradient(150deg,#082f49_0%,#0f766e_56%,#1d4ed8_100%)] p-4 shadow-[0_16px_36px_rgba(8,47,73,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Building2 size={22} />
              </div>
              <div>
                <p className="text-lg font-black text-white">PropManager</p>
                <p className="text-xs text-cyan-100/80">Create your account in minutes</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_22px_56px_rgba(8,47,73,0.10)] backdrop-blur-xl sm:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">Get started</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-[30px]">Create your account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Fill in your details and start using the platform.</p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: "owner", label: "Property Owner", sub: "Manage properties" },
                { value: "tenant", label: "Tenant", sub: "View lease details" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`rounded-2xl border-2 p-3 text-left transition-all duration-200 ${
                    form.role === r.value
                      ? "border-cyan-500 bg-cyan-50 shadow-[0_10px_24px_rgba(6,182,212,0.12)]"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.role === r.value ? "text-cyan-800" : "text-slate-700"}`}>{r.label}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">{r.sub}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Personal</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                      <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="John" className="input-field bg-white/90 py-2.5 text-sm" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Middle Name</label>
                      <input type="text" name="middleName" value={form.middleName} onChange={handleChange} placeholder="A." className="input-field bg-white/90 py-2.5 text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                      <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Doe" className="input-field bg-white/90 py-2.5 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Contact</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className="input-field bg-white/90 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[130px_1fr]">
                        <select
                          name="countryCode"
                          value={form.countryCode}
                          onChange={handleChange}
                          className="input-field bg-white/90 py-2.5 text-sm"
                        >
                          {COUNTRY_CODES.map((code) => (
                            <option key={code.value} value={code.value}>{code.label}</option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          placeholder="Mobile number"
                          className="input-field bg-white/90 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Security</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Min 6 characters"
                        className="input-field bg-white/90 py-2.5 pr-10 text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Re-enter password"
                        className="input-field bg-white/90 py-2.5 pr-10 text-sm"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-1 w-full rounded-2xl py-3 text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <div className="relative my-5 flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="bg-white px-4 text-xs text-slate-400">Already have an account?</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center w-full rounded-2xl border-2 border-slate-200 bg-slate-50/70 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
            >
              Sign in instead
            </Link>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {["Fast setup", "Secure access", "No hidden fees"].map((item) => (
                <div key={item} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-[11px] font-medium text-slate-500">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
