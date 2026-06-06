import React, { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Mail, 
  Palette, 
  Lock, 
  RefreshCw, 
  Menu, 
  X, 
  Calculator,
  ChevronRight,
  Sparkles,
  PieChart
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card'
import './App.css'

// Custom inline SVG icons for GitHub & LinkedIn to prevent package version dependency issues
const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const Linkedin = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" rx="1" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

// Import screenshots
import screenshot1 from './assets/screenshot1.jpeg'
import screenshot2 from './assets/screenshot2.jpeg'
import screenshot3 from './assets/screenshot3.jpeg'

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeScreenIndex, setActiveScreenIndex] = useState(0)
  
  // Interactive Split Bill state
  const [splitAmount, setSplitAmount] = useState('3000')
  const [splitMembers, setSplitMembers] = useState(['Sai', 'Arun', 'Rahul'])
  const [activeTab, setActiveTab] = useState('features')

  const screenshots = [
    {
      img: screenshot1,
      title: "Premium Bento Dashboard",
      desc: "Get a high-level view of your balances, personal card limits, and collaborative group expense ledgers in one dark, unified interface."
    },
    {
      img: screenshot2,
      title: "Personal Ledger",
      desc: "Log individual expenses, categorise spending instantly, and track outflow parameters with visual threshold gauges."
    },
    {
      img: screenshot3,
      title: "Interactive Analytics",
      desc: "Visualise spending velocity and category allocations using custom responsive charts with automatic legend breakdowns."
    }
  ]

  // Handle header background modification on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto scroll screenshots in hero mockup
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreenIndex((prev) => (prev + 1) % screenshots.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Calculate quick splits
  const calculatedSplit = parseFloat(splitAmount) ? (parseFloat(splitAmount) / splitMembers.length).toFixed(2) : '0.00'

  return (
    <div className="relative min-h-screen bg-[#0B1020] text-white overflow-x-hidden selection:bg-brand-accent/30 selection:text-brand-accent font-sans">
      
      {/* BACKGROUND GLOW SHAPES */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none animate-blob-1" />
      <div className="absolute top-[30%] right-[-10%] w-[45%] h-[55%] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none animate-blob-2" />
      <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[50%] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none" />

      {/* 1. GLASSMORPHIC HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0B1020]/75 backdrop-blur-xl border-b border-white/5 py-4 shadow-lg shadow-black/20' 
          : 'bg-transparent py-6 border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20 group-hover:border-brand-accent/40 transition-colors duration-200">
              <Wallet className="h-5 w-5 text-brand-accent" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Expense<span className="text-brand-accent">OS</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-brand-muted hover:text-white transition-colors duration-200">Features</a>
            <a href="#demo" className="text-sm text-brand-muted hover:text-white transition-colors duration-200">Interactive Demo</a>
            <a href="#how-it-works" className="text-sm text-brand-muted hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#download" className="text-sm text-brand-muted hover:text-white transition-colors duration-200 font-medium text-brand-accent hover:text-brand-accent-hover">Download APK</a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="#download">
              <Button variant="default" size="default">
                <Download className="mr-2 h-4 w-4" /> Download App
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0B1020]/95 backdrop-blur-2xl border-b border-white/5 py-6 px-6 flex flex-col space-y-4 shadow-xl">
            <a 
              href="#features" 
              className="text-lg text-brand-muted hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#demo" 
              className="text-lg text-brand-muted hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Interactive Demo
            </a>
            <a 
              href="#how-it-works" 
              className="text-lg text-brand-muted hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#download" 
              className="text-lg text-brand-accent hover:text-brand-accent-hover py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Download APK
            </a>
            <hr className="border-white/5 my-2" />
            <a href="#download" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download APK
              </Button>
            </a>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 flex flex-col space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 self-center lg:self-start">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              <span className="text-xs font-semibold text-brand-accent tracking-wide uppercase">V1.0 STANDALONE PREVIEW</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] font-display text-white">
              The Collaborative <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-emerald-400">
                Financial Vault
              </span>
            </h1>
            
            <p className="text-lg text-brand-muted max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Take complete control of personal ledger items, coordinate joint bills, and settle shared debts instantly with an elegant, responsive dark banking app aesthetic.
            </p>
            
            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a href="#download">
                <Button size="lg" className="w-full sm:w-auto text-brand-bg font-bold">
                  <Download className="mr-2.5 h-5 w-5" /> Download Standalone APK
                </Button>
              </a>
              <a href="#demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/10 hover:bg-white/5 text-white">
                  Try Interactive Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-8 max-w-md mx-auto lg:mx-0 border-t border-brand-border">
              <div>
                <p className="text-2xl font-black text-white font-display">0.0%</p>
                <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">Interest Fees</p>
              </div>
              <div>
                <p className="text-2xl font-black text-brand-accent font-display">3 Presets</p>
                <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">Dynamic Themes</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-display">Optimal</p>
                <p className="text-xs text-brand-muted mt-1 uppercase tracking-wider">Settlement Routing</p>
              </div>
            </div>
          </div>

          {/* Hero Phone Showcase Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
            
            {/* Premium Phone Mockup */}
            <div className="relative w-[290px] h-[580px] md:w-[320px] md:h-[640px] rounded-[48px] border-[10px] border-brand-surface bg-brand-bg shadow-2xl premium-card-shadow flex flex-col overflow-hidden select-none">
              {/* Dynamic Camera Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 h-4 w-24 bg-brand-surface rounded-full z-45 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
              </div>

              {/* Fake Status Bar */}
              <div className="absolute top-0 inset-x-0 h-9 bg-[#0B1020]/90 backdrop-blur-md z-30 flex items-center justify-between px-6 text-[10px] font-bold text-brand-muted border-b border-white/5 select-none pt-2">
                <span>9:41</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[8px] bg-white/5 px-1 py-0.5 rounded border border-white/10 text-brand-accent">5G</span>
                  <div className="w-5 h-2.5 border border-brand-muted/40 rounded-sm p-0.5 flex items-center">
                    <div className="bg-brand-accent h-full w-[85%] rounded-2xs" />
                  </div>
                </div>
              </div>
              
              {/* Sliding Screen Gallery */}
              <div className="relative flex-1 bg-[#0B1020] overflow-hidden pt-9 pb-6">
                <div 
                  className="flex flex-col h-[300%] transition-transform duration-700 ease-in-out" 
                  style={{ transform: `translateY(-${activeScreenIndex * 33.33}%)` }}
                >
                  <img src={screenshot1} className="h-1/3 w-full object-cover" alt="Bento Dashboard" />
                  <img src={screenshot2} className="h-1/3 w-full object-cover" alt="Personal Ledger" />
                  <img src={screenshot3} className="h-1/3 w-full object-cover" alt="SVG Analytics" />
                </div>
              </div>

              {/* Float Caption Card (Inside the Phone Screen overlaying screenshot) */}
              <div className="glass-card rounded-2xl p-3.5 absolute bottom-8 left-3.5 right-3.5 z-40 border border-white/10 shadow-xl shadow-black/40">
                <p className="text-[10px] text-brand-accent font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> {screenshots[activeScreenIndex].title}
                </p>
                <p className="text-[10px] text-brand-text/90 leading-relaxed">
                  {screenshots[activeScreenIndex].desc}
                </p>
              </div>

              {/* Fake Home Indicator Bar */}
              <div className="absolute bottom-0 inset-x-0 h-6 bg-[#0B1020]/95 backdrop-blur-md z-30 flex items-center justify-center border-t border-white/5 select-none">
                <div className="w-20 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Slider Navigation Dots */}
            <div className="flex space-x-3 mt-6">
              {screenshots.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveScreenIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeScreenIndex ? 'w-8 bg-brand-accent' : 'w-2.5 bg-brand-muted/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURES BENTO GRID */}
      <section id="features" className="py-24 px-6 relative bg-brand-surface/30 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-white">
              Engineered for Wealth. <br />
              <span className="text-brand-accent">Styled for Control.</span>
            </h2>
            <p className="text-brand-muted mt-4 font-sans text-sm md:text-base">
              A comprehensive system matching the premium Dark Banking layout. Manage personal ledgers, shared vaults, and minimized settlements out-of-the-box.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Personal Spending */}
            <Card className="col-span-1 border-brand-border bg-brand-card hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4">
                  <Wallet className="h-6 w-6 text-indigo-400" />
                </div>
                <CardTitle>Personal Spending Ledger</CardTitle>
                <CardDescription>
                  Keep an organized record of individual transactions. Categorise expenses with visual tags and stay under budget using customizable threshold limit trackers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual Widget Demo */}
                <div className="bg-[#0B1020]/60 border border-brand-border/40 rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-muted font-medium">Monthly Limits Tracker</span>
                    <span className="text-brand-accent font-bold">₹16,400 / ₹20,000</span>
                  </div>
                  {/* Gauge Progress Bar */}
                  <div className="w-full bg-brand-surface rounded-full h-2.5 overflow-hidden border border-brand-border/20">
                    <div className="bg-brand-accent h-full rounded-full transition-all" style={{ width: '82%' }} />
                  </div>
                  <div className="flex justify-between items-center bg-brand-surface/40 p-2 rounded-xl border border-white/5">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-sm">🛒</span>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">Grocery Bill</p>
                        <p className="text-[10px] text-brand-muted">Food & Drinks</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">-₹3,200</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Collaborative Vaults */}
            <Card className="col-span-1 border-brand-border bg-brand-card hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20 mb-4">
                  <Users className="h-6 w-6 text-brand-accent" />
                </div>
                <CardTitle>Collaborative Group Splits</CardTitle>
                <CardDescription>
                  Create collaborative vaults for trips, shared flats, or dinners. Assign group splits automatically using Equal, Exact, or Percentage sharing structures.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual splits Demo */}
                <div className="bg-[#0B1020]/60 border border-brand-border/40 rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center text-xs border-b border-brand-border/40 pb-2">
                    <span className="font-semibold text-white">Goa Trip Vault</span>
                    <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/20 font-bold uppercase">Split: Equal</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-brand-muted">Total Bill</span>
                    <span className="font-bold text-white">₹12,000.00</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] bg-brand-surface/40 px-2 py-1.5 rounded-lg">
                      <span className="text-white font-medium">Sai paid</span>
                      <span className="text-brand-accent font-bold">₹4,000 (Owed)</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] bg-brand-surface/40 px-2 py-1.5 rounded-lg">
                      <span className="text-white font-medium">Arun paid</span>
                      <span className="text-[#FF6B6B] font-bold">₹4,000 (Owes)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Optimized Settlements */}
            <Card className="col-span-1 border-brand-border bg-brand-card hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 mb-4">
                  <RefreshCw className="h-6 w-6 text-teal-400 animate-spin-slow" />
                </div>
                <CardTitle>Minimized Debt Routing</CardTitle>
                <CardDescription>
                  Our built-in balance engine auto-resolves complex multi-peer debts into the minimal list of transactions. No redundant payments or backward cash loops.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Minimized Settlements Visual */}
                <div className="bg-[#0B1020]/60 border border-brand-border/40 rounded-2xl p-4 flex flex-col space-y-2">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider text-left">Auto-Settle Suggestion</p>
                  <div className="flex items-center justify-between py-1 border-b border-brand-border/20 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-brand-surface flex items-center justify-center text-[10px] text-brand-accent font-bold">A</span>
                      <span className="text-white">Arun</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-accent" />
                    <div className="flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-brand-surface flex items-center justify-center text-[10px] text-brand-accent font-bold">S</span>
                      <span className="text-white">Sai</span>
                    </div>
                    <span className="font-bold text-brand-accent">₹2,000</span>
                  </div>
                  <div className="flex items-center justify-between py-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-brand-surface flex items-center justify-center text-[10px] text-brand-accent font-bold">R</span>
                      <span className="text-white">Rahul</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-accent" />
                    <div className="flex items-center space-x-2">
                      <span className="h-5 w-5 rounded-full bg-brand-surface flex items-center justify-center text-[10px] text-brand-accent font-bold">S</span>
                      <span className="text-white">Sai</span>
                    </div>
                    <span className="font-bold text-brand-accent">₹2,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4: SVG Charts */}
            <Card className="col-span-1 md:col-span-2 border-brand-border bg-brand-card hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-4">
                  <PieChart className="h-6 w-6 text-amber-400" />
                </div>
                <CardTitle>Bespoke Responsive SVG Analytics</CardTitle>
                <CardDescription>
                  Track your monthly velocity and category allocations directly. No bloated charts: just clean vector-drawn line graphs and weight distribution donut charts.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Mini Line Chart SVG */}
                <div className="bg-[#0B1020]/60 border border-brand-border/40 rounded-2xl p-4 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2 self-start">Daily Spending Velocity</p>
                  <svg viewBox="0 0 200 80" className="w-full h-16">
                    {/* Grid Lines */}
                    <line x1="0" y1="65" x2="200" y2="65" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="35" x2="200" y2="35" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    {/* Line Path */}
                    <path
                      d="M 10 50 Q 40 30 70 60 T 130 20 T 190 35"
                      fill="none"
                      stroke="#D7FF3F"
                      strokeWidth="2.5"
                    />
                    {/* Area fill */}
                    <path
                      d="M 10 50 Q 40 30 70 60 T 130 20 T 190 35 L 190 65 L 10 65 Z"
                      fill="url(#grad)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D7FF3F" />
                        <stop offset="100%" stopColor="#D7FF3F" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Mini Donut Chart SVG */}
                <div className="bg-[#0B1020]/60 border border-brand-border/40 rounded-2xl p-4 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2 self-start">Category Weight Allocation</p>
                  <svg viewBox="0 0 100 100" className="w-20 h-20">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                    {/* Segment Food (45%) */}
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#D7FF3F" strokeWidth="12" strokeDasharray="154 220" transform="rotate(-90 50 50)" />
                    {/* Segment Travel (30%) */}
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#818CF8" strokeWidth="12" strokeDasharray="66 220" strokeDashoffset="-154" transform="rotate(-90 50 50)" />
                  </svg>
                </div>

              </CardContent>
            </Card>

            {/* Feature 5: Dynamic Preset Themes */}
            <Card className="col-span-1 border-brand-border bg-brand-card hover:border-brand-accent/20 transition-all duration-300 flex flex-col justify-between">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4">
                  <Palette className="h-6 w-6 text-indigo-400" />
                </div>
                <CardTitle>Dynamic Visual Themes</CardTitle>
                <CardDescription>
                  Switch background preset modes instantly. Switch between Navy Blue (Default), Pure Black (High Contrast), and Light White (Clean Day) dynamically.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Theme options capsules */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                  <div className="bg-[#0B1020] border border-brand-accent/30 p-2.5 rounded-xl text-brand-accent">Navy Blue</div>
                  <div className="bg-[#000000] border border-white/5 p-2.5 rounded-xl text-white">Pure Black</div>
                  <div className="bg-[#F3F4F6] border border-brand-card/10 p-2.5 rounded-xl text-brand-bg">Light White</div>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE WIDGET DEMO */}
      <section id="demo" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-white mb-6">
            Split Bills Instantly. <br />
            <span className="text-brand-accent">See the math work.</span>
          </h2>
          <p className="text-brand-muted max-w-xl mx-auto mb-12 text-sm md:text-base">
            Try our interactive split calculator below. Enter any bill value and see how Equal splitting is computed automatically in real-time.
          </p>

          <Card className="border-brand-border bg-brand-card/60 backdrop-blur-md max-w-lg mx-auto text-left premium-card-shadow border border-white/5">
            <CardHeader className="border-b border-brand-border/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-brand-accent" /> Group Expense Simulator
              </CardTitle>
              <CardDescription>Simulates calculations exactly like our React Native client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Input split amount */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Bill Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-muted font-semibold">₹</span>
                  <input
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    placeholder="Enter bill value"
                    className="w-full bg-[#0B1020] border border-brand-border hover:border-brand-accent/20 focus:border-brand-accent focus:outline-none rounded-xl py-3 pl-8 pr-4 font-semibold text-white text-lg transition-colors"
                  />
                </div>
              </div>

              {/* Members Capsule List */}
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Group Members ({splitMembers.length})</label>
                <div className="flex flex-wrap gap-2">
                  {splitMembers.map((member, idx) => (
                    <div key={idx} className="bg-brand-surface border border-white/5 text-xs text-white px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1">
                      <span className="h-3.5 w-3.5 rounded-full bg-brand-accent text-brand-bg flex items-center justify-center font-bold text-[8px] uppercase">{member[0]}</span>
                      <span>{member}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time result banner */}
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Equal Share Per Member</p>
                  <p className="text-2xl font-black text-white font-display mt-0.5">₹{calculatedSplit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Total Members</p>
                  <p className="text-lg font-bold text-white mt-0.5">{splitMembers.length}</p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </section>

      {/* 5. HOW IT ACTUALLY WORKS */}
      <section id="how-it-works" className="py-24 px-6 relative bg-brand-surface/30 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-white">
              The Settlement Protocol. <br />
              <span className="text-brand-accent">In Three Simple Steps.</span>
            </h2>
            <p className="text-brand-muted mt-4 font-sans text-sm md:text-base">
              Learn how ExpenseOS integrates personal logging, collaborative bills, and peer-to-peer bank approvals.
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            
            {/* Desktop Connector Icons */}
            <div className="absolute top-[16px] left-[28%] hidden lg:block pointer-events-none opacity-30">
              <ChevronRight className="h-6 w-6 text-brand-accent animate-pulse" />
            </div>
            <div className="absolute top-[16px] left-[61%] hidden lg:block pointer-events-none opacity-30">
              <ChevronRight className="h-6 w-6 text-brand-accent animate-pulse" />
            </div>

            {/* Step 1 */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-brand-accent text-brand-bg font-black font-display text-xl flex items-center justify-center shadow-lg shadow-brand-accent/10 border border-brand-accent/20 mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-3">Authentic Access</h3>
              <p className="text-sm text-brand-muted leading-relaxed font-sans max-w-sm">
                Register a secure profile using your email. The app secures communications using a JWT token rotating authorization structure to communicate with your backend.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-brand-surface border border-brand-border text-brand-accent font-black font-display text-xl flex items-center justify-center shadow-lg mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-3">Log Expense & Split</h3>
              <p className="text-sm text-brand-muted leading-relaxed font-sans max-w-sm">
                Create personal spending logs or flat-sharing vaults. Add group bills and invite friends. Share shares equally, by custom rupee values, or percentage distributions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-brand-surface border border-brand-border text-brand-accent font-black font-display text-xl flex items-center justify-center shadow-lg mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-3">Optimize & Settle</h3>
              <p className="text-sm text-brand-muted leading-relaxed font-sans max-w-sm">
                The balance engine checks group debts to suggest optimal transactions. Click Settle Up to pay, and the recipient approves the request to adjust balance states.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. DOWNLOAD APK & INSTALLATION */}
      <section id="download" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          
          <Card className="border-brand-border bg-gradient-to-br from-brand-card to-[#0B1020] p-8 md:p-12 premium-card-shadow border border-brand-accent/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
            
            {/* Highlight Glow blur */}
            <div className="absolute right-[-10%] top-[-10%] w-[350px] h-[350px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col space-y-6 text-center md:text-left max-w-xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/20 self-center md:self-start">
                <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Android Standalone APK</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-white">
                Download Standalone preview build
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed font-sans">
                EAS Android preview build is compiled as an installation-ready standalone APK. Tap below to download the APK directly, or scan the QR code via Expo Go for development.
              </p>
              
              {/* Badge download buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <Button size="lg" className="bg-brand-accent text-brand-bg font-extrabold py-6 rounded-2xl shadow-xl shadow-brand-accent/10 glow-hover">
                  <Download className="mr-2.5 h-5.5 w-5.5" /> Download Android APK
                </Button>
                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 py-6 rounded-2xl">
                  View Source Code
                </Button>
              </div>
            </div>

            {/* Mock QR Card */}
            <div className="glass-card rounded-[32px] p-6 w-[240px] text-center flex flex-col items-center justify-center border border-white/10 shadow-2xl relative">
              <div className="bg-white p-4 rounded-2xl mb-4 border border-brand-border flex items-center justify-center">
                {/* Visual grid representing QR Code */}
                <div className="h-28 w-28 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="h-8 w-8 bg-black rounded" />
                    <div className="h-8 w-8 bg-black rounded" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="h-8 w-8 bg-black rounded" />
                    <div className="h-4 w-4 bg-brand-accent rounded" />
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-white">Scan Metro Code</p>
              <p className="text-[10px] text-brand-muted mt-1 leading-relaxed">Run the app instantly on your phone via Expo Go client.</p>
            </div>

          </Card>

        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER */}
      <footer className="py-16 px-6 bg-brand-card/50 border-t border-brand-border text-brand-muted">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Logo / Meta */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start space-y-4 text-center md:text-left">
            <a href="#" className="flex items-center space-x-3 group">
              <div className="h-8 w-8 rounded-lg bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                <Wallet className="h-4 w-4 text-brand-accent" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-display">
                Expense<span className="text-brand-accent">OS</span>
              </span>
            </a>
            <p className="text-xs text-brand-muted max-w-sm leading-relaxed">
              Premium collaborative financial operating system and billing ledger. Configured to align with dark fintech dashboard aesthetics.
            </p>
            <p className="text-[10px] text-brand-muted/60">
              © {new Date().getFullYear()} ExpenseOS. All rights reserved.
            </p>
          </div>

          {/* Socials Connection */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Connect With Me</p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/SaiAmirthesh" 
                target="_blank" 
                rel="noreferrer" 
                className="h-10 w-10 rounded-xl bg-brand-surface hover:bg-brand-accent hover:text-brand-bg flex items-center justify-center border border-brand-border transition-all duration-200"
                aria-label="GitHub profile link"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-10 w-10 rounded-xl bg-brand-surface hover:bg-brand-accent hover:text-brand-bg flex items-center justify-center border border-brand-border transition-all duration-200"
                aria-label="LinkedIn profile link"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            <p className="text-[10px] text-brand-muted/70">Check out recent developments and commits on Github.</p>
          </div>

          {/* Direct Email Senders */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider font-display">Need Support?</p>
            <a href="mailto:saiamirthesh8419@gmail.com" className="inline-flex items-center space-x-2 bg-brand-surface hover:bg-brand-accent/10 border border-brand-border hover:border-brand-accent/20 px-4 py-2.5 rounded-xl text-xs text-white transition-all duration-200 group w-full md:w-auto">
              <Mail className="h-4 w-4 text-brand-accent" />
              <span className="font-semibold group-hover:text-brand-accent transition-colors">saiamirthesh8419@gmail.com</span>
            </a>
            <p className="text-[10px] text-brand-muted/70">Direct support inquiry for bug logging or configuration suggestions.</p>
          </div>

        </div>
      </footer>

    </div>
  )
}
