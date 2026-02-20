import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, LayoutGrid, Edit3, Brain, Music2, ListMusic, Share2,
  BookOpen, Mic2, Guitar, FileText, Search, Star, Clock, Zap, Users,
  TrendingUp, Ear, MessageSquare, PlayCircle, CheckCircle2
} from "lucide-react";

const SECTIONS = [
  { id: "dashboard",       label: "Your Dashboard",       icon: LayoutGrid },
  { id: "viewing-editing", label: "Viewing & Editing",    icon: Edit3 },
  { id: "ai-professor",    label: "AI Theory Professor",  icon: Brain },
  { id: "setlists-sharing",label: "Setlists & Sharing",   icon: ListMusic },
];

/* ── Reusable sub-components ── */

function FeatureCard({ icon: Icon, title, description, iconBg = "bg-[#D0021B]/10", iconColor = "text-[#D0021B]" }) {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-xl p-4 flex gap-3 items-start hover:border-[#333] transition-colors group">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-1 group-hover:text-white/90">{title}</p>
        <p className="text-[13px] text-[#888] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SubGroupLabel({ color, label, note }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{label}</h3>
      {note && <span className="text-[11px] text-[#555] ml-1">{note}</span>}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle, iconBg = "bg-[#D0021B]/10", iconColor = "text-[#D0021B]" }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-5 border-b border-[#1e1e1e]">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-[#666] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function StepList({ steps }) {
  return (
    <div className="space-y-2 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="w-5 h-5 rounded-full bg-[#D0021B]/15 text-[#D0021B] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
          <p className="text-[13px] text-[#888] leading-relaxed">{step}</p>
        </div>
      ))}
    </div>
  );
}

function Callout({ icon: Icon = Zap, iconColor = "text-amber-400", iconBg = "bg-amber-400/10", children }) {
  return (
    <div className={`${iconBg} border border-amber-400/15 rounded-xl p-4 flex gap-3 items-start mb-6`}>
      <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-[13px] text-[#999] leading-relaxed">{children}</p>
    </div>
  );
}

/* ── Main Page ── */

export default function HelpGuide() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const sectionRefs = useRef({});

  // Scroll-spy: update active TOC item as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) { observer.observe(el); sectionRefs.current[id] = el; }
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans">

      {/* ── Sidebar TOC ── */}
      <aside className="fixed top-16 left-60 w-52 h-[calc(100vh-4rem)] bg-[#111] border-r border-[#1e1e1e] flex flex-col z-10">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#1e1e1e]">
          <Link to={createPageUrl("Home")}>
            <button className="flex items-center gap-1.5 text-[#555] hover:text-white transition-colors text-xs mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </button>
          </Link>
          <p className="text-[10px] text-[#444] leading-tight">Help & Guide</p>
        </div>

        {/* TOC nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-3 px-2">Contents</p>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-[#D0021B] text-white"
                  : "text-[#666] hover:bg-[#1a1a1a] hover:text-[#ccc]"
              }`}
            >
              <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Pro tip */}
        <div className="px-3 py-4 border-t border-[#1e1e1e]">
          <div className="bg-[#D0021B]/8 border border-[#D0021B]/15 rounded-lg p-3">
            <p className="text-[11px] text-[#D0021B] font-semibold mb-1">Pro Tip</p>
            <p className="text-[11px] text-[#666] leading-relaxed">
              Press <kbd className="bg-[#1e1e1e] rounded px-1 text-[#aaa] font-mono">?</kbd> in the app to see all keyboard shortcuts.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="ml-[28rem] flex-1 min-h-screen pt-20">
        <div className="max-w-2xl px-8 py-6">

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-1.5 bg-[#D0021B]/10 border border-[#D0021B]/20 rounded-full px-3 py-1 mb-4">
              <BookOpen className="w-3 h-3 text-[#D0021B]" />
              <span className="text-[11px] font-semibold text-[#D0021B] uppercase tracking-wide">User Guide</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-3">
              Welcome to<br />
              <span className="text-[#D0021B]">ChartScribe AI</span>
            </h1>
            <p className="text-[15px] text-[#777] leading-relaxed max-w-lg">
              Your intelligent musical companion for creating, managing, and analyzing chord charts — whether you're prepping for a gig or deep in theory study.
            </p>

            {/* Quick-start tiles */}
            <div className="grid grid-cols-3 gap-3 mt-7">
              {[
                { icon: Edit3,    label: "Create a Chart",  desc: "AI or manual",      color: "text-blue-400",   bg: "bg-blue-400/10" },
                { icon: Brain,    label: "Learn with AI",   desc: "Lessons & theory",  color: "text-purple-400", bg: "bg-purple-400/10" },
                { icon: ListMusic,label: "Build Setlists",  desc: "Organize & share",  color: "text-green-400",  bg: "bg-green-400/10" },
              ].map((item) => (
                <div key={item.label} className="bg-[#141414] border border-[#242424] rounded-xl p-3.5 hover:border-[#333] transition-colors cursor-default">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mb-2.5`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <p className="text-[13px] font-bold text-white">{item.label}</p>
                  <p className="text-[11px] text-[#555] mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1e1e1e] mb-12" />

          {/* ── Section 1: Dashboard ── */}
          <section id="dashboard" className="mb-12 scroll-mt-8">
            <SectionHeading icon={LayoutGrid} title="Navigating Your Dashboard" subtitle="Your central hub for all your music" />

            <p className="text-[13px] text-[#777] leading-relaxed mb-5">
              The <strong className="text-white font-semibold">Home</strong> dashboard is where you manage your entire library. The sidebar gives you instant access to every collection.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {[
                { icon: LayoutGrid, label: "My Charts",      desc: "Every chart you've created." },
                { icon: Star,       label: "Favorites",      desc: "Starred charts for quick access." },
                { icon: Clock,      label: "Recent",         desc: "Jump back in where you left off." },
                { icon: ListMusic,  label: "Setlists",       desc: "Charts grouped for gigs or practice." },
                { icon: Share2,     label: "Shared with me", desc: "Charts other musicians sent you." },
              ].map((item) => (
                <div key={item.label} className="bg-[#141414] border border-[#242424] rounded-xl p-3 flex items-start gap-2.5">
                  <item.icon className="w-3.5 h-3.5 text-[#D0021B] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">{item.label}</p>
                    <p className="text-[11px] text-[#555] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#141414] border border-[#242424] rounded-xl p-4">
              <p className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#D0021B]" /> Finding & Organizing
              </p>
              <div className="space-y-2.5">
                {[
                  { label: "Search", detail: "Use the sidebar search bar to find any song by title instantly." },
                  { label: "Filter", detail: "Narrow your library by Key or Time Signature from the main view." },
                  { label: "Bulk Actions", detail: "Multi-select charts to add to a Setlist, share, or delete in one go." },
                ].map((row) => (
                  <div key={row.label} className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[13px] text-[#777]"><strong className="text-[#ccc] font-semibold">{row.label}:</strong> {row.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-[#1e1e1e] mb-12" />

          {/* ── Section 2: Viewing & Editing ── */}
          <section id="viewing-editing" className="mb-12 scroll-mt-8">
            <SectionHeading icon={Edit3} title="Viewing & Editing Charts" subtitle="A focused canvas for reading and writing music" iconBg="bg-blue-500/10" iconColor="text-blue-400" />

            <p className="text-[13px] text-[#777] leading-relaxed mb-6">
              Open any song to enter the <strong className="text-white font-semibold">Chart Viewer</strong>. The sidebar slides away so you get a clean, focused canvas.
            </p>

            {/* Notation modes */}
            <p className="text-[13px] font-semibold text-white mb-2 flex items-center gap-2">
              <Music2 className="w-3.5 h-3.5 text-blue-400" /> Notation Modes
            </p>
            <p className="text-[12px] text-[#555] mb-3">Toggle instantly — the underlying data never changes.</p>
            <div className="grid grid-cols-3 gap-2.5 mb-7">
              {[
                { example: "C  G  Am  F", label: "Standard Chords",  desc: "Traditional chord names." },
                { example: "I  V  vi  IV", label: "Roman Numerals",   desc: "Harmonic function analysis." },
                { example: "1  5  6−  4",  label: "Nashville Numbers", desc: "Key-independent NNS." },
              ].map((mode) => (
                <div key={mode.label} className="bg-[#111] border border-[#242424] rounded-xl p-3.5 text-center">
                  <p className="text-base font-black text-[#D0021B] font-mono mb-1.5 tracking-tight">{mode.example}</p>
                  <p className="text-[11px] font-bold text-white mb-0.5">{mode.label}</p>
                  <p className="text-[10px] text-[#555] leading-relaxed">{mode.desc}</p>
                </div>
              ))}
            </div>

            {/* Editor features */}
            <p className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Editor Features
            </p>
            <div className="space-y-2.5">
              <FeatureCard icon={Zap}       title="AI Generation & Refinement"  description="Generate a full chart from a song title or progression. Use 'Refine with AI' to adjust harmonies or rewrite sections."          iconBg="bg-yellow-400/10" iconColor="text-yellow-400" />
              <FeatureCard icon={ListMusic} title="Drag-and-Drop Sections"       description="Rearrange Verse, Chorus, Bridge, and more by simply dragging sections into the order you want."                                    iconBg="bg-blue-400/10"   iconColor="text-blue-400" />
              <FeatureCard icon={Edit3}     title="Measure-by-Measure Editing"   description="Click any measure to edit its chord, beat duration, arrangement cue, and articulation markings."                                    iconBg="bg-purple-400/10" iconColor="text-purple-400" />
              <FeatureCard icon={FileText}  title="Right-Click Context Menus"    description="Right-click any section or measure to quickly duplicate, delete, insert a blank measure, or reorder."                               iconBg="bg-green-400/10"  iconColor="text-green-400" />
            </div>
          </section>

          <div className="border-t border-[#1e1e1e] mb-12" />

          {/* ── Section 3: AI Professor ── */}
          <section id="ai-professor" className="mb-12 scroll-mt-8">
            <SectionHeading icon={Brain} title="AI Music Theory Professor" subtitle="A built-in tutor that knows your chart inside and out" iconBg="bg-purple-500/10" iconColor="text-purple-400" />

            <p className="text-[13px] text-[#777] leading-relaxed mb-4">
              Open the <strong className="text-white font-semibold">Theory Panel</strong> from any chart. Features are split into three groups.
            </p>

            <Callout>
              <strong className="text-white font-semibold">Tip:</strong> Features like Chord Suggestions and Voicings work best with a <strong className="text-white font-semibold">measure selected</strong> first. Others (Lessons, Ear Training, Arrangement) analyze the whole song automatically.
            </Callout>

            {/* Learning */}
            <SubGroupLabel color="bg-blue-400" label="Learning" />
            <div className="space-y-2.5 mb-7">
              <FeatureCard icon={MessageSquare} title="Interactive Chat"   description="Ask the AI any question about the song's theory, chord transitions, or structure. Full chart context included." iconBg="bg-blue-400/10" iconColor="text-blue-400" />
              <FeatureCard icon={BookOpen}      title="Chart Lessons"      description="Generate a comprehensive lesson on the song's harmony, structure, and playing techniques."                        iconBg="bg-blue-400/10" iconColor="text-blue-400" />
              <FeatureCard icon={PlayCircle}    title="Practice Routines"  description="Get targeted exercises scaled to your skill level, designed to help you master the chart progressively."        iconBg="bg-blue-400/10" iconColor="text-blue-400" />
            </div>

            {/* Analysis */}
            <SubGroupLabel color="bg-yellow-400" label="Analysis" note="— select a measure first" />
            <div className="space-y-2.5 mb-7">
              <FeatureCard icon={Zap}    title="Chord Suggestions"    description="Discover creative substitutions for any chord, with harmonic reasoning for each alternative."                                     iconBg="bg-yellow-400/10" iconColor="text-yellow-400" />
              <FeatureCard icon={Guitar} title="Voicing Diagrams"     description="Guitar chord diagrams ranked by how well they fit the song's key and context, with technique tips for each shape."            iconBg="bg-yellow-400/10" iconColor="text-yellow-400" />
              <FeatureCard icon={Ear}    title="Ear Training"         description="A listening guide for the whole song — what to focus on, what makes specific changes interesting, and how to internalize it." iconBg="bg-yellow-400/10" iconColor="text-yellow-400" />
            </div>

            {/* Composition */}
            <SubGroupLabel color="bg-purple-400" label="Composition" />
            <div className="space-y-2.5">
              <FeatureCard icon={Mic2}        title="Arrangement Tips"      description="Instrument-specific ideas for drums, bass, keys, and guitar to help your band sound cohesive."                           iconBg="bg-purple-400/10" iconColor="text-purple-400" />
              <FeatureCard icon={TrendingUp}  title="Scale & Mode Guides"   description="Recommended scales and modes for improvising or writing solos, with explanations of why each one fits."                 iconBg="bg-purple-400/10" iconColor="text-purple-400" />
              <FeatureCard icon={Users}       title="Comparative Analysis"  description="See which famous songs share similar progressions — great for musical context and inspiration."                           iconBg="bg-purple-400/10" iconColor="text-purple-400" />
            </div>
          </section>

          <div className="border-t border-[#1e1e1e] mb-12" />

          {/* ── Section 4: Setlists & Sharing ── */}
          <section id="setlists-sharing" className="mb-16 scroll-mt-8">
            <SectionHeading icon={Share2} title="Setlists & Sharing" subtitle="Organize your performances and collaborate with your band" iconBg="bg-green-500/10" iconColor="text-green-400" />

            <p className="text-[13px] text-[#777] leading-relaxed mb-6">
              Group charts into Setlists, generate AI learning paths, share with bandmates, and export print-ready PDFs.
            </p>

            <div className="space-y-3">
              {/* Creating a Setlist */}
              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  <ListMusic className="w-3.5 h-3.5 text-green-400" /> Creating a Setlist
                </p>
                <StepList steps={[
                  "Go to My Charts on the Home page.",
                  "Enable multi-select and check off the songs you want.",
                  'Tap "Add to Setlist" from the bulk actions bar.',
                  "Name your setlist and optionally add an event date and venue.",
                  "Done — it appears instantly in the sidebar.",
                ]} />
              </div>

              {/* Learning Path */}
              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-purple-400" /> Setlist Learning Path
                </p>
                <p className="text-[13px] text-[#777] leading-relaxed mt-2">
                  Open any Setlist and use <strong className="text-white font-semibold">AI Learning Path</strong> to generate a structured study plan across all the songs. Great for mastering a full gig set efficiently.
                </p>
              </div>

              {/* Sharing */}
              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" /> Sharing a Chart
                </p>
                <StepList steps={[
                  "Open the chart you want to share.",
                  "Click the Share button in the top toolbar.",
                  "Add a collaborator by email — assign View or Edit permission.",
                  "Or generate a public link for anyone outside the app.",
                ]} />
              </div>

              {/* PDF */}
              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4">
                <p className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-orange-400" /> PDF Export
                </p>
                <p className="text-[13px] text-[#777] leading-relaxed mt-2">
                  Open any chart, click <strong className="text-white font-semibold">Export PDF</strong> from the toolbar, and get a clean print-ready file in seconds. Works in all three notation modes.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[#1e1e1e] pt-6 flex items-center justify-between">
            <p className="text-[11px] text-[#444]">ChartScribe AI — Made for musicians, powered by AI.</p>
            <Link to={createPageUrl("Home")}>
              <button className="text-[12px] text-[#D0021B] hover:underline font-medium flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to App
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}