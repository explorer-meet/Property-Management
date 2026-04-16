import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Database,
  Eye,
  Lock,
  Mail,
  Shield,
  UserCheck,
} from "lucide-react";

const PRIVACY_SUMMARY = [
  {
    title: "Data minimization",
    text: "We collect only information needed to support property, lease, payment, and request workflows.",
    icon: Database,
  },
  {
    title: "Role-based access",
    text: "Owners and tenants only see the information relevant to their portal and responsibilities.",
    icon: Eye,
  },
  {
    title: "User control",
    text: "Users can request access, correction, or deletion of eligible personal data through support.",
    icon: UserCheck,
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "What we collect",
    body: "PropManager stores the details needed to operate the platform, including user account information, property details, lease records, rent entries, inquiries, maintenance requests, and notifications. We do not request unnecessary personal data for unrelated marketing purposes.",
  },
  {
    title: "How we use information",
    body: "Collected information is used to power product workflows such as property management, tenant communication, maintenance handling, notification delivery, and rent tracking. We also use limited operational data to improve reliability, investigate support issues, and maintain platform security.",
  },
  {
    title: "Who can see what",
    body: "Visibility is limited by role. Owners can access their properties, leases, tenants, payments, and requests. Tenants can only access their own requests, rent history, inquiries, and related account information. Internal access should be restricted to operational support needs.",
  },
  {
    title: "Retention and deletion",
    body: "Data is retained only as long as required for platform operation, support, auditing, and legal or operational obligations. Where practical and permitted, users may request correction or deletion of data by contacting support.",
  },
  {
    title: "Security practices",
    body: "We use authenticated access, role-based controls, and secure application workflows to reduce exposure risk. No internet-connected application can promise zero risk, but platform design decisions aim to keep access controlled and data exposure limited.",
  },
  {
    title: "Support and privacy requests",
    body: "If you have a privacy question, want to update inaccurate information, or need help understanding how your data is used, contact support with enough detail for the team to investigate and respond clearly.",
  },
];

const PRIVACY_PROMISES = [
  "We do not sell user data to third parties.",
  "We keep feature access aligned with the user's role.",
  "We design product workflows to avoid unnecessary data exposure.",
  "We support requests for correction or deletion where applicable.",
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9fbff_0%,#ffffff_34%,#eef7ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900">
            <div className="rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 p-2 shadow-lg shadow-cyan-200/70">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-wide">PropManager</p>
              <p className="text-xs text-slate-500">Privacy</p>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-white p-8 shadow-[0_24px_80px_rgba(8,145,178,0.10)] sm:p-10">
          <div className="flex items-center gap-3 text-cyan-700">
            <Lock size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Privacy Policy</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            How PropManager handles your data
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            This page explains what we collect, why it is needed, who can access it, and how users can request updates or removal where appropriate.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            <Shield size={14} />
            Updated for the current public product experience
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {PRIVACY_SUMMARY.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-lg shadow-cyan-200/80">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            {PRIVACY_SECTIONS.map((section, index) => (
              <article
                key={section.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-extrabold text-white shadow-lg shadow-cyan-200/80">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{section.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-5">
            <section className="rounded-[1.75rem] border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 shadow-[0_16px_40px_rgba(8,145,178,0.08)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Our privacy principles</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Practical commitments behind the policy</h2>
              <div className="mt-5 space-y-3">
                {PRIVACY_PROMISES.map((promise) => (
                  <div
                    key={promise}
                    className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600 shadow-sm"
                  >
                    {promise}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Privacy support</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Need clarification or a data update?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Send a message with your account email, role, and the specific request. That makes it easier to verify and respond accurately.
              </p>
              <a
                href="mailto:support@propmanager.com"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-200 transition hover:shadow-cyan-300"
              >
                <Mail size={16} />
                Contact privacy support
              </a>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
