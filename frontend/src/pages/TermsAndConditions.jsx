import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CircleCheckBig,
  FileText,
  Gavel,
  Mail,
  ShieldCheck,
} from "lucide-react";

const TERMS_HIGHLIGHTS = [
  {
    title: "Fair platform use",
    text: "Use the service for lawful property-management activity and keep account details accurate.",
    icon: FileText,
  },
  {
    title: "Account protection",
    text: "Users are responsible for credential security and must report suspected unauthorized access.",
    icon: ShieldCheck,
  },
  {
    title: "Operational enforcement",
    text: "Access may be restricted where misuse, abuse, or security risk affects the platform.",
    icon: Gavel,
  },
];

const TERMS_SECTIONS = [
  {
    title: "Using the platform",
    body: "By using PropManager, you agree to provide accurate account, property, and lease information and to use the platform only for lawful property-management activities.",
  },
  {
    title: "Account security",
    body: "You are responsible for keeping your credentials secure and for activities performed using your account. Notify us immediately if you suspect unauthorized access.",
  },
  {
    title: "User data responsibilities",
    body: "Owners and tenants must ensure that the information they submit is current and correct. Inaccurate records can affect leasing, rent, maintenance, and notification workflows.",
  },
  {
    title: "Acceptable use",
    body: "You may not use PropManager to harm the service, disrupt other users, upload malicious content, scrape unauthorized data, or attempt to access resources without permission.",
  },
  {
    title: "Service availability",
    body: "We aim to provide a reliable service, but temporary interruptions may occur during maintenance, updates, or unforeseen issues. Features may evolve as the product improves.",
  },
  {
    title: "Termination and restriction",
    body: "We may suspend or terminate access if an account violates these terms, creates abuse risk, compromises platform integrity, or interferes with the experience of other users.",
  },
  {
    title: "Limitation of responsibility",
    body: "PropManager supports workflows and record-keeping, but users remain responsible for business decisions, lease obligations, and verifying the accuracy of important data entered into the platform.",
  },
  {
    title: "Changes to these terms",
    body: "Terms may be updated as the product evolves. Continued use of the platform after changes are published indicates acceptance of the updated terms.",
  },
];

const TERMS_NOTES = [
  "Keep account and property details accurate.",
  "Use the platform respectfully and lawfully.",
  "Protect your own login credentials.",
  "Contact support if a term is unclear.",
];

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_28%,#eef6ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900">
            <div className="rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 p-2 shadow-lg shadow-sky-200/70">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-wide">PropManager</p>
              <p className="text-xs text-slate-500">Legal</p>
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
        <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-white p-8 shadow-[0_24px_80px_rgba(14,165,233,0.10)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                Terms
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                Terms and Conditions
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Plain-language terms covering acceptable use, account responsibility, security expectations, and how access may be limited if the platform is misused.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
              <ShieldCheck size={18} />
              Updated April 16, 2026
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {TERMS_HIGHLIGHTS.map(({ title, text, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-3 text-white shadow-lg shadow-sky-200/80">
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-5">
            {TERMS_SECTIONS.map((section, index) => (
              <article
                key={section.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-extrabold text-white shadow-lg shadow-sky-200/70">
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
            <section className="rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-6 shadow-[0_16px_40px_rgba(14,165,233,0.08)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Quick notes</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">The short version</h2>
              <div className="mt-5 space-y-3">
                {TERMS_NOTES.map((note) => (
                  <div key={note} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600 shadow-sm">
                    <CircleCheckBig size={18} className="mt-1 shrink-0 text-sky-600" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Questions about the terms?</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Contact support for clarification</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                If a clause is unclear, reach out before relying on assumptions. A short explanation request is better than acting on uncertainty.
              </p>
              <a
                href="mailto:support@propmanager.com"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:shadow-sky-300"
              >
                <Mail size={16} />
                Email legal support
              </a>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TermsAndConditions;
