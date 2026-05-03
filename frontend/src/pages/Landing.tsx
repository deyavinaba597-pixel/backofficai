import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  FileText,
  Receipt,
  Users,
  Building2,
  Bot,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  BarChart2,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Invoice Management',
    description: 'Track, create, and manage invoices automatically. Get alerts for overdue payments.',
  },
  {
    icon: Receipt,
    title: 'Expense Tracking',
    description: 'Submit, review, and approve expenses with policy-based automation.',
  },
  {
    icon: Users,
    title: 'Payroll Processing',
    description: 'Run payroll for your entire team with one click. Weekly, bi-weekly, or monthly.',
  },
  {
    icon: Building2,
    title: 'Vendor Management',
    description: 'Keep track of all your vendors, payment terms, and payment history.',
  },
  {
    icon: Bot,
    title: 'AI Agent',
    description: 'Ask your AI assistant anything. It takes real actions on your behalf.',
  },
  {
    icon: Shield,
    title: 'Policy Engine',
    description: 'Set rules for automatic approvals, alerts, and payment limits.',
  },
];

const steps = [
  {
    icon: Zap,
    title: 'Connect your data',
    description: 'Import your invoices, expenses, and employee data in minutes.',
  },
  {
    icon: Bot,
    title: 'Let AI handle it',
    description: 'Your AI agent monitors everything and takes action automatically.',
  },
  {
    icon: TrendingUp,
    title: 'Focus on growth',
    description: 'Spend your time on what matters — building your business.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'CEO, Bloom Studio',
    avatar: 'SC',
    text: 'BackOfficeAI saved me 15 hours a week. The AI agent handles all my invoicing and payroll automatically. I can finally focus on design.',
    rating: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Founder, Apex Consulting',
    avatar: 'MR',
    text: "I used to dread month-end. Now it's done before I even think about it. The expense approval workflow alone is worth the price.",
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Owner, Patel & Associates',
    avatar: 'PP',
    text: 'The AI agent is like having a full-time CFO. It caught three overdue invoices I had completely forgotten about.',
    rating: 5,
  },
];

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for solo founders',
    features: ['Up to 50 invoices/month', '5 employees', 'AI Agent (basic)', 'Email support'],
    cta: 'Get started free',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/month',
    description: 'For growing teams',
    features: ['Unlimited invoices', 'Up to 50 employees', 'AI Agent (full)', 'Priority support', 'Analytics dashboard', 'CSV exports'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$299',
    period: '/month',
    description: 'For established businesses',
    features: ['Everything in Growth', 'Unlimited employees', 'Custom policies', 'API access', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact sales',
    highlighted: false,
  },
];

const painPoints = [
  { icon: Clock, text: 'Hours lost chasing overdue invoices' },
  { icon: Receipt, text: 'Expense reports piling up unapproved' },
  { icon: Users, text: 'Payroll errors costing you money and trust' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">BackOfficeAI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8">
            <Zap className="h-3.5 w-3.5" />
            Powered by AI
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            Your AI{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Back-Office Team
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            BackOfficeAI handles your invoices, expenses, payroll, and vendors — automatically.
            So you can focus on building your business.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              Start Free — No credit card
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              See a demo
            </button>
          </div>

          <p className="text-sm text-gray-400 mt-6">
            Join 500+ small businesses already saving 10+ hours per week
          </p>

          {/* Hero visual */}
          <div className="mt-16 relative">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-400">BackOfficeAI Dashboard</span>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Cash Balance', value: '$124,500', color: 'text-green-600' },
                    { label: 'Pending Invoices', value: '$38,200', color: 'text-yellow-600' },
                    { label: 'Monthly Expenses', value: '$12,400', color: 'text-red-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-white border p-4 shadow-sm">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-white border p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">AI Agent</p>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white max-w-xs ml-auto">
                      Run payroll for all employees
                    </div>
                    <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 max-w-sm">
                      ✅ Payroll processed for 12 employees. Total: $48,200. All transactions recorded.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Running a business is hard.
            <br />
            <span className="text-indigo-400">Back-office work shouldn't be.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            Every hour you spend on admin is an hour not spent on your customers.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {painPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-gray-800 p-5 text-left">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-sm text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get set up in minutes. Your AI agent starts working immediately.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-indigo-200 to-transparent" />
                )}
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg shadow-indigo-200">
                  <step.icon className="h-9 w-9 text-white" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              One platform for your entire back office.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by business owners</h2>
            <p className="text-gray-500 text-lg">Don't take our word for it.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-sm font-medium text-green-700 mb-4">
              <CheckCircle className="h-3.5 w-3.5" />
              No credit card required to start
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mx-auto mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-200 scale-105'
                    : 'bg-white border border-gray-100 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1 text-xs font-bold text-yellow-900">
                    MOST POPULAR
                  </div>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${plan.highlighted ? 'text-indigo-200' : 'text-green-500'}`} />
                      <span className={plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-16">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-base font-semibold text-gray-900">Full feature comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Feature</th>
                    <th className="text-center px-6 py-3 text-gray-500 font-medium">Starter</th>
                    <th className="text-center px-6 py-3 text-indigo-600 font-semibold">Growth</th>
                    <th className="text-center px-6 py-3 text-gray-500 font-medium">Scale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    ['Invoices', '50/month', 'Unlimited', 'Unlimited'],
                    ['Employees', '5', '50', 'Unlimited'],
                    ['AI Agent', 'Basic', 'Full', 'Full + Custom'],
                    ['Analytics', '—', '✅', '✅'],
                    ['CSV Export', '—', '✅', '✅'],
                    ['Audit Trail', '—', '✅', '✅'],
                    ['Email Alerts', '—', '✅', '✅'],
                    ['API Access', '—', '—', '✅'],
                    ['Custom Integrations', '—', '—', '✅'],
                    ['Support', 'Email', 'Priority', 'Dedicated'],
                  ].map(([feature, starter, growth, scale]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-700 font-medium">{feature}</td>
                      <td className="px-6 py-3 text-center text-gray-500">{starter}</td>
                      <td className="px-6 py-3 text-center text-indigo-600 font-medium bg-indigo-50/50">{growth}</td>
                      <td className="px-6 py-3 text-center text-gray-500">{scale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Money back + FAQ */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            {/* Guarantee */}
            <div className="rounded-2xl bg-green-50 border border-green-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">30-day money-back guarantee</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Not happy in the first 30 days? We'll refund you, no questions asked. We're confident you'll love it.
              </p>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Common questions</h3>
              <div className="space-y-3">
                {[
                  { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade anytime.' },
                  { q: 'Is my data secure?', a: 'Yes — encrypted, isolated per company.' },
                  { q: 'Do I need a credit card to start?', a: 'No. Free plan requires no card.' },
                ].map(({ q, a }) => (
                  <div key={q}>
                    <p className="text-sm font-medium text-gray-800">{q}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Waitlist */}
      <section className="py-20 bg-white">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Want a personal demo?</h2>
          <p className="text-gray-500 mb-8">We'll walk you through the product and set up your account for free.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Book a demo
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">No spam. We'll reply within 24 hours.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Ready to reclaim your time?
          </h2>
          <p className="text-indigo-200 text-xl mb-10 max-w-xl mx-auto">
            Join hundreds of business owners who've automated their back office with AI.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-base font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            Start for free today
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="text-indigo-300 text-sm mt-4">No credit card required · Set up in 5 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white">BackOfficeAI</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Blog</a>
            </div>
            <p className="text-xs text-gray-500">© 2025 BackOfficeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
