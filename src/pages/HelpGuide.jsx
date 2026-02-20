import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, LayoutGrid, Edit3, Brain, Music2, ListMusic, Share2,
  ChevronDown, ChevronRight, BookOpen, Mic2, Headphones, Guitar,
  FileText, Search, Star, Clock, Zap, Users, TrendingUp, Ear,
  MessageSquare, PlayCircle, CheckCircle2
} from "lucide-react";

const sections = [
  { id: "dashboard", label: "Navigating Your Dashboard", icon: LayoutGrid },
  { id: "viewing-editing", label: "Viewing & Editing Charts", icon: Edit3 },
  { id: "ai-professor", label: "AI Music Theory Professor", icon: Brain },
  { id: "setlists-sharing", label: "Setlists & Sharing", icon: ListMusic },
];

function SectionAnchor({ id }) {
  return <div id={id} className="-mt-20 pt-20" />;
}

function FeatureCard({ icon: Icon, title, description, color = "text-[#D0021B]" }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex gap-4 items-start hover:border-[#3a3a3a] transition-colors">
      <div className="w-9 h-9 rounded-lg bg-[#D0021B]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        <p className="text-sm text-[#a0a0a0] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StepBadge({ number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#D0021B] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
      {number}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, color = "bg-[#D0021B]/10", iconColor = "text-[#D0021B]" }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-[#6b6b6b] text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function HelpGuide() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* Fixed Left TOC */}
      <div className="fixed top-0 left-0 w-64 h-screen bg-[#141414] border-r border-[#2a2a2a] flex flex-col z-10">
        {/* Logo area */}
        <div className="p-5 border-b border-[#2a2a2a]">
          <Link to={createPageUrl("Home")}>
            <button className="flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5 w-8 h-8 flex-shrink-0">
              <div className="bg-white rounded-sm flex items-center justify-center">
                <span className="text-black font-black text-[9px]">1</span>
              </div>
              <div className="rounded-sm flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a' }}>
                <span className="text-[#D0021B] font-black text-[9px]">4</span>
              </div>
              <div className="rounded-sm flex items-center justify-center border border-[#D0021B]" style={{ background: '#0a0a0a' }}>
                <span className="text-[#D0021B] font-black text-[9px]">5</span>
              </div>
              <div className="rounded-sm flex items-center justify-center border border-[#c17f00]" style={{ background: '#0a0a0a' }}>
                <span className="text-[#e09a00] font-black text-[9px]">6-</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white font-mono leading-tight">ChartScribe</p>
              <p className="text-xs text-[#D0021B] font-mono font-bold leading-tight">Help & Guide</p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="text-xs font-bold text-[#6b6b6b] uppercase tracking-widest mb-3 px-2">Contents</p>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-[#D0021B] text-white"
                  : "text-[#a0a0a0] hover:bg-[#252525] hover:text-white"
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Quick tip at bottom */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="bg-[#D0021B]/10 border border-[#D0021B]/20 rounded-lg p-3">
            <p className="text-xs text-[#D0021B] font-semibold mb-1">Pro Tip</p>
            <p className="text-xs text-[#a0a0a0] leading-relaxed">Press <kbd className="bg-[#2a2a2a] rounded px-1 py-0.5 text-white font-mono">?</kbd> anywhere in the app to see keyboard shortcuts.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 px-10 py-12 max-w-4xl">

        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-[#D0021B]/10 border border-[#D0021B]/20 rounded-full px-4 py-1.5 mb-5">
            <BookOpen className="w-3.5 h-3.5 text-[#D0021B]" />
            <span className="text-xs font-semibold text-[#D0021B]">User Guide</span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Welcome to<br />
            <span className="text-[#D0021B]">ChartScribe AI</span>
          </h1>
          <p className="text-lg text-[#a0a0a0] leading-relaxed max-w-2xl">
            Your intelligent musical companion for creating, managing, learning, and analyzing chord charts.
            Whether you're prepping for a gig or studying music theory — this guide covers everything you need.
          </p>

          {/* Quick Start Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Edit3, label: "Create a Chart", desc: "AI-generated or manual", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Brain, label: "Learn with AI", desc: "Lessons, tips & theory", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: ListMusic, label: "Build Setlists", desc: "Organize & share", color: "text-green-400", bg: "bg-green-400/10" },
            ].map((item) => (
              <div key={item.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#3a3a3a] transition-colors">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a] mb-14" />

        {/* ─── SECTION 1: Dashboard ─── */}
        <SectionAnchor id="dashboard" />
        <div className="mb-14">
          <SectionHeader icon={LayoutGrid} title="Navigating Your Dashboard" subtitle="Your central hub for organizing all your music" />

          <p className="text-[#a0a0a0] mb-6 leading-relaxed">
            When you log in, you land on the <strong className="text-white">Home</strong> dashboard. The sidebar on the left gives you instant access to every part of your library.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: LayoutGrid, label: "My Charts", desc: "Your full library of every chord chart you've created." },
              { icon: Star, label: "Favorites", desc: "Charts you've starred for fast, one-click access." },
              { icon: Clock, label: "Recent", desc: "Jump back into whatever you were last working on." },
              { icon: ListMusic, label: "Setlists", desc: "Collections of charts grouped for gigs or practice." },
              { icon: Share2, label: "Shared with me", desc: "Charts other musicians have sent to you." },
            ].map((item) => (
              <div key={item.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-start gap-3">
                <item.icon className="w-4 h-4 text-[#D0021B] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#D0021B]" />
              Finding & Organizing Your Music
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#a0a0a0]"><strong className="text-white">Search:</strong> Use the search bar at the top of the sidebar to instantly find any song by title.</p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#a0a0a0]"><strong className="text-white">Filter:</strong> Narrow your library by musical Key or Time Signature using the filter controls in the main view.</p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#a0a0a0]"><strong className="text-white">Bulk Actions:</strong> Select multiple charts at once to add them to a Setlist, share them with bandmates, or delete them in bulk.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a] mb-14" />

        {/* ─── SECTION 2: Viewing & Editing ─── */}
        <SectionAnchor id="viewing-editing" />
        <div className="mb-14">
          <SectionHeader icon={Edit3} title="Viewing & Editing Charts" subtitle="A focused, distraction-free canvas for reading and writing music" color="bg-blue-500/10" iconColor="text-blue-400" />

          <p className="text-[#a0a0a0] mb-8 leading-relaxed">
            Open any song to enter the <strong className="text-white">Chart Viewer</strong>. The sidebar slides away, giving you a focused canvas. From here you can view, play along, and edit every detail of your chart.
          </p>

          {/* Notation Modes */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-blue-400" />
              Flexible Notation Modes
            </h3>
            <p className="text-sm text-[#a0a0a0] mb-4">Toggle between three display modes instantly — your underlying chart data never changes, it's just a different view lens.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: "C  G  Am  F", label: "Standard Chords", desc: "Traditional chord names. Great for most musicians." },
                { num: "I  V  vi  IV", label: "Roman Numerals", desc: "Classical theory analysis showing harmonic function." },
                { num: "1  5  6-  4", label: "Nashville Numbers", desc: "Studio-standard NNS. Key-independent and transposable." },
              ].map((mode) => (
                <div key={mode.label} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-center">
                  <p className="text-lg font-black text-[#D0021B] font-mono mb-2 tracking-tight">{mode.num}</p>
                  <p className="text-xs font-bold text-white mb-1">{mode.label}</p>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">{mode.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Features */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-400" />
              The Chart Editor
            </h3>
            <div className="space-y-3">
              <FeatureCard
                icon={Zap}
                title="AI Generation & Refinement"
                description="Create a new chart from scratch using AI — just provide a song title or chord progression. After generation, use 'Refine with AI' to adjust harmonies, rewrite sections, or request stylistic changes."
                color="text-yellow-400"
              />
              <FeatureCard
                icon={ListMusic}
                title="Drag-and-Drop Sections"
                description="Rearrange song sections (Verse, Chorus, Bridge, etc.) by clicking and dragging. Reorganizing your chart is as easy as rearranging sticky notes."
                color="text-blue-400"
              />
              <FeatureCard
                icon={Edit3}
                title="Measure-by-Measure Editing"
                description="Click any measure to open its properties panel. Change the chord symbol, adjust beat duration, add an arrangement cue like 'Drops out' or 'Build up', and apply articulation markings."
                color="text-purple-400"
              />
              <FeatureCard
                icon={FileText}
                title="Right-Click Context Menus"
                description="Right-click on any section or measure to access quick actions: duplicate, delete, insert a blank measure, or move sections up and down."
                color="text-green-400"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a] mb-14" />

        {/* ─── SECTION 3: AI Professor ─── */}
        <SectionAnchor id="ai-professor" />
        <div className="mb-14">
          <SectionHeader icon={Brain} title="AI Music Theory Professor" subtitle="A built-in music tutor that knows your chart inside and out" color="bg-purple-500/10" iconColor="text-purple-400" />

          <p className="text-[#a0a0a0] mb-4 leading-relaxed">
            Open the <strong className="text-white">Theory Panel</strong> from any chart view. Features are organized into three groups: <span className="text-blue-400 font-semibold">Learning</span>, <span className="text-yellow-400 font-semibold">Analysis</span>, and <span className="text-purple-400 font-semibold">Composition</span>.
          </p>

          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 mb-8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-sm text-[#a0a0a0] leading-relaxed">
              <strong className="text-white">Tip:</strong> Many features work best when you have a <strong className="text-white">measure selected</strong> in your chart first (Chord Suggestions, Voicings). Others analyze the <strong className="text-white">entire song</strong> at once (Lessons, Ear Training, Arrangement Tips).
            </p>
          </div>

          {/* Learning Group */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-base font-bold text-white">Learning</h3>
            </div>
            <div className="space-y-3">
              <FeatureCard
                icon={MessageSquare}
                title="Interactive Chat"
                description="Ask the AI professor any question about the song's music theory, tricky chord transitions, or overall structure. It has full context of your chart and responds in plain English."
                color="text-blue-400"
              />
              <FeatureCard
                icon={BookOpen}
                title="Chart Lessons"
                description="Generate a comprehensive lesson covering the song's harmony, structure, and required playing techniques. Great for understanding a song before trying to learn it."
                color="text-blue-400"
              />
              <FeatureCard
                icon={PlayCircle}
                title="Practice Routines"
                description="Get personalized exercise recommendations tailored to your skill level. The AI breaks the chart into targeted exercises to help you master it progressively."
                color="text-blue-400"
              />
            </div>
          </div>

          {/* Analysis Group */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <h3 className="text-base font-bold text-white">Analysis</h3>
              <span className="text-xs text-[#6b6b6b] ml-1">— requires a measure to be selected</span>
            </div>
            <div className="space-y-3">
              <FeatureCard
                icon={Zap}
                title="Chord Suggestions"
                description="Select any measure then ask the AI for alternatives. Discover creative chord substitutions with harmonic reasoning — great for reharmonization or when you want to spice up an arrangement."
                color="text-yellow-400"
              />
              <FeatureCard
                icon={Guitar}
                title="Voicing Tips & Diagrams"
                description="Get guitar-specific chord diagrams for the selected chord. The AI ranks available voicings by how well they suit the song's key and context, with technique tips for each shape."
                color="text-yellow-400"
              />
              <FeatureCard
                icon={Ear}
                title="Ear Training"
                description="Generates a listening guide for the whole song — what harmonic movements to focus on, what makes specific chord changes interesting, and practice tips for internalizing the sound."
                color="text-yellow-400"
              />
            </div>
          </div>

          {/* Composition Group */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-base font-bold text-white">Composition</h3>
            </div>
            <div className="space-y-3">
              <FeatureCard
                icon={Mic2}
                title="Arrangement Tips"
                description="Get instrument-specific playing ideas for drums, bass, keys, and guitar. Great for helping a band get on the same page about how the song should feel and what everyone should be doing."
                color="text-purple-400"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Scale & Mode Guides"
                description="Discover the best scales and modes to use for improvising or writing solos over the chart. Comes with explanations of why each scale works and tips for using them musically."
                color="text-purple-400"
              />
              <FeatureCard
                icon={Users}
                title="Comparative Analysis"
                description="See how your chord progression relates to famous songs and well-known musical patterns. A great way to place a new song in a familiar musical context and find inspiration."
                color="text-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a] mb-14" />

        {/* ─── SECTION 4: Setlists & Sharing ─── */}
        <SectionAnchor id="setlists-sharing" />
        <div className="mb-20">
          <SectionHeader icon={Share2} title="Setlists & Sharing" subtitle="Organize your performances and collaborate with your band" color="bg-green-500/10" iconColor="text-green-400" />

          <p className="text-[#a0a0a0] mb-8 leading-relaxed">
            Music is meant to be shared. ChartScribe AI makes it easy to collaborate with your band, prepare for a gig, and share your work with the world.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <ListMusic className="w-5 h-5 text-green-400 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">Creating a Setlist</h3>
              </div>
              <div className="space-y-2 pl-8">
                {[
                  "Go to My Charts on the Home page.",
                  "Click the multi-select button and check off the songs you want.",
                  "Click "Add to Setlist" from the bulk actions bar that appears.",
                  "Create a new setlist — add a name, event date, and venue.",
                  "Your setlist is now saved and accessible from the sidebar."
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs text-[#D0021B] font-bold font-mono mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <p className="text-sm text-[#a0a0a0]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">Setlist Learning Path</h3>
              </div>
              <p className="text-sm text-[#a0a0a0] leading-relaxed pl-8">
                Open any Setlist and use the <strong className="text-white">AI Learning Path</strong> feature to generate a structured study plan for the entire collection of songs. The AI connects theory concepts across charts to help you master a full set efficiently.
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Share2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">Sharing a Chart</h3>
              </div>
              <div className="space-y-2 pl-8">
                {[
                  "Open the chart you want to share.",
                  "Click the Share button in the top toolbar.",
                  "Add a collaborator by email — choose View or Edit permission.",
                  "Or generate a public link to send to anyone outside the app."
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs text-[#D0021B] font-bold font-mono mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <p className="text-sm text-[#a0a0a0]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">PDF Export</h3>
              </div>
              <p className="text-sm text-[#a0a0a0] leading-relaxed pl-8">
                Need a physical copy for the stage or studio? Open any chart and click <strong className="text-white">Export PDF</strong> from the toolbar. You'll get a clean, professional, print-ready PDF in seconds. Works in all three notation modes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2a2a] pt-8 text-center">
          <p className="text-sm text-[#6b6b6b]">ChartScribe AI — Made for musicians, powered by AI.</p>
          <Link to={createPageUrl("Home")}>
            <button className="mt-4 text-sm text-[#D0021B] hover:underline font-medium">← Back to App</button>
          </Link>
        </div>
      </div>
    </div>
  );
}