import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import { logout } from "../app/slices/authSlice";
import toast from "react-hot-toast";
import { Modal, Alert } from "./UI";
import { AlertTriangle } from "lucide-react";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isOwner = user?.role === "owner";
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setLogoutModalOpen(false);
    toast.success("Logged out successfully.");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-150">
      <Sidebar />
      <main className="relative flex-1 overflow-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[26rem] w-[26rem] rounded-full bg-blue-400/20 blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-purple-400/20 blur-3xl animate-blob-delay" />
        </div>
        
        {/* Top Right Navigation Bar */}
        <div className="sticky top-0 right-0 z-40 bg-gradient-to-b from-white/60 to-transparent backdrop-blur-sm border-b border-white/40">
          <div className="flex justify-end items-center gap-3 px-6 lg:px-8 py-3">
            <button
              onClick={() => {
                navigate("/");
              }}
              className="group px-4 py-2 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white text-sm font-medium text-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-95"
            >
              Back to Home
            </button>
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="group px-4 py-2 rounded-lg border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-sm font-medium text-rose-700 shadow-sm hover:shadow-md hover:border-rose-300 hover:bg-gradient-to-r hover:from-rose-100 hover:to-red-100 transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <LogOut size={16} className="text-rose-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="relative p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      <Modal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} title="Confirm Logout">
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">You are about to log out</p>
                <p className="mt-1 text-xs text-gray-600">
                  You will be redirected to the sign-in page and will need credentials to access your dashboard again.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white hover:from-red-700 hover:to-orange-700 shadow-sm"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
