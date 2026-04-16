import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeHelp,
  Building2,
  Clock3,
  LifeBuoy,
  Mail,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FAQ_GROUPS = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I add a property?",
        a: "Sign in as an owner, open Properties, and create a new property with unit and location details.",
      },
      {
        q: "Can I manage multiple properties in one account?",
        a: "Yes. PropManager is designed for single or multi-property portfolios, so you can manage everything from one dashboard.",
      },
      {
        q: "How quickly can I set up my first property?",
        a: "Most owners can create an account, add a property, and begin managing units in just a few minutes. The workflow is intentionally simple so you can get operational quickly.",
      },
    ],
  },
  {
    title: "Tenants & Requests",
    items: [
      {
        q: "Can tenants raise maintenance requests?",
        a: "Yes. Tenants can submit maintenance requests from their dashboard and track status updates in real time.",
      },
      {
        q: "Can tenants send inquiries to owners?",
        a: "Yes. Tenants can contact owners through the inquiries workflow, and owners can manage those conversations from their portal.",
      },
      {
        q: "Can owners track request progress after a tenant submits an issue?",
        a: "Yes. Maintenance requests support status-based tracking so both owners and tenants can see whether a request is open, in progress, or resolved.",
      },
    ],
  },
  {
    title: "Rent & Payments",
    items: [
      {
        q: "Can I track paid and pending rent?",
        a: "Yes. Rent management shows paid, pending, and overdue statuses for each lease so you can monitor collections clearly.",
      },
      {
        q: "Do tenants see their own payment history?",
        a: "Yes. Tenant accounts can view their rent records, payment history, and upcoming dues from their dashboard.",
      },
      {
        q: "Can owners monitor overdue rent at a glance?",
        a: "Yes. Owner dashboards and rent management screens highlight pending and overdue rent so collections can be prioritized quickly.",
      },
    ],
  },
  {
    title: "Platform & Access",
    items: [
      {
        q: "Is PropManager mobile friendly?",
        a: "Yes. The application is responsive and works across desktop, tablet, and mobile browsers.",
      },
      {
        q: "Is user access role-based?",
        a: "Yes. Owners and tenants each see only the data and tools that match their role.",
      },
      {
        q: "Does the platform work well on phones and tablets?",
        a: "Yes. Users can review rent, notifications, requests, inquiries, and dashboard information from smaller screens without switching to a separate mobile app.",
      },
    ],
  },
  {
    title: "Security & Support",
    items: [
      {
        q: "How is my account protected?",
        a: "PropManager uses authenticated access, role-based visibility, and secure workflows to reduce the risk of unauthorized account access or accidental data exposure.",
      },
      {
        q: "How do I contact support if I need help?",
        a: "If you need help, contact support with your role, the page you were using, and a short description of the problem so the team can respond faster.",
      },
    ],
  },
];

const QUICK_TOPICS = ["rent", "maintenance", "tenant", "vacancy", "notifications"];

const SUPPORT_METRICS = [
  { label: "Help topics", value: "5 sections", icon: BadgeHelp },
  { label: "Support response", value: "Within 24 hrs", icon: Clock3 },
  { label: "Access model", value: "Role-based", icon: ShieldCheck },
];

const HELP_OPTIONS = [
  {
    title: "Email support",
    text: "Reach the team for account issues, product questions, or feature clarification.",
    icon: Mail,
  },
  {
    title: "Workflow guidance",
    text: "Use this page to understand common owner and tenant flows before reaching out.",
    icon: LifeBuoy,
  },
];

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState({});

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return FAQ_GROUPS;

    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query)
      ),
    })).filter((group) => group.items.length > 0);
  }, [searchTerm]);

  const toggleItem = (key) => {
    setOpenItems((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const totalQuestions = FAQ_GROUPS.reduce((count, group) => count + group.items.length, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.45),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#eef6ff_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg shadow-blue-200/70">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-wide">PropManager</p>
              <p className="text-xs text-slate-500">Help Center</p>
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
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(37,99,235,0.12)] sm:p-10">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_28%)]" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              <Sparkles size={14} />
              Support
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Quick answers for owners and tenants, organized so users can find what they need without digging through the landing page.
            </p>
          </div>

          <div className="relative mt-8 max-w-2xl">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for rent, maintenance, tenants..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSearchTerm(topic)}
                className="rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold capitalize text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
              >
                {topic}
              </button>
            ))}
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Clear search
              </button>
            ) : null}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {SUPPORT_METRICS.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-3 text-white shadow-lg shadow-blue-200/80">
                  <Icon size={20} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 space-y-8">
          <div className="flex flex-col gap-3 rounded-[1.75rem] border border-blue-100 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 p-6 shadow-[0_16px_40px_rgba(37,99,235,0.08)] sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Knowledge base</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                Browse {totalQuestions} answers across owner and tenant workflows
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Search narrows results instantly. Open a card to read the full answer and keep scanning through the rest of the collection.
            </p>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No FAQ matched your search.</p>
              <p className="mt-2 text-sm text-slate-500">Try a broader keyword like property, rent, or tenant.</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <section
                key={group.title}
                className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                </div>
                <div className="space-y-3">
                  {group.items.map((item, index) => {
                    const key = `${group.title}-${index}`;
                    const isOpen = Boolean(openItems[key]);

                    return (
                      <article
                        key={key}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all duration-200 hover:border-blue-200 hover:bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(key)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="text-sm font-semibold leading-6 text-slate-900 sm:text-base">{item.q}</span>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm">
                            {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="border-t border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-600">
                            {item.a}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </section>

        <section className="mt-12 rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Still need help?</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Support options for account and workflow questions</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                If the answer is not here, send the support team a concise message with your role, the page you were on, and what you expected to happen.
              </p>
            </div>
            <a
              href="mailto:support@propmanager.com"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:shadow-blue-300"
            >
              <Mail size={16} />
              Contact support
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {HELP_OPTIONS.map(({ title, text, icon: Icon }) => (
              <article key={title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white p-3 text-blue-700 shadow-sm">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQ;
