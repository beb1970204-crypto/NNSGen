import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronRight, Music, Share2, Star, BarChart3 } from "lucide-react";

export default function BeginnerGuide({ open, onOpenChange }) {
  const [step, setStep] = React.useState(0);

  const steps = [
    {
      title: "Welcome to ChartScribe AI",
      description: "Your AI-powered chord charting companion for musicians",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p>ChartScribe AI makes it easy to create, organize, and share professional chord charts. Powered by AI, Chordonomicon data, and your own expertise.</p>
          <p className="text-sm italic">Let's take a quick tour of what you can do!</p>
        </div>
      )
    },
    {
      title: "Creating Charts",
      description: "Generate charts with AI or manually",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Two ways to create:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>AI Generation:</strong> Provide song title and artist. ChartScribe pulls from Chordonomicon or uses AI to transcribe chords</li>
            <li><strong>Reference Files:</strong> Upload images/PDFs for the AI to use as context for more accurate transcription</li>
            <li><strong>Manual Entry:</strong> Create charts from scratch in the editor with full customization</li>
          </ul>
          <p className="text-sm">Set key, time signature, and tempo to match your song.</p>
        </div>
      )
    },
    {
      title: "Chart Editor",
      description: "Edit and arrange your charts",
      icon: BarChart3,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Powerful editing features:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Sections:</strong> Verse, Chorus, Bridge, etc. with repeat counts</li>
            <li><strong>Chord Details:</strong> Add symbols, cues, and arrangement notes</li>
            <li><strong>Notation Symbols:</strong> Diamond, marcato, push, pull, fermata for expression</li>
            <li><strong>Modulation Support:</strong> Change keys within sections</li>
          </ul>
          <p className="text-sm">Drag to reorder sections, edit inline for quick changes.</p>
        </div>
      )
    },
    {
      title: "Display Modes",
      description: "View chords in different notations",
      icon: BarChart3,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Three notation systems:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Chords:</strong> Standard chord symbols (C, Am, Dm7)</li>
            <li><strong>Roman:</strong> Roman numerals (I, vi, ii)</li>
            <li><strong>Nashville Numbers:</strong> Numeric system (1, 6, 2)</li>
          </ul>
          <p className="text-sm">Switch between modes in the chart viewer. Export PDFs in any notation.</p>
        </div>
      )
    },
    {
      title: "Organization & Setlists",
      description: "Keep charts organized for gigs",
      icon: Star,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Stay organized:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Favorites:</strong> Star charts for quick access from any view</li>
            <li><strong>Setlists:</strong> Group charts for specific performances with dates and venues</li>
            <li><strong>Search & Filter:</strong> Find by title, artist, key, or time signature</li>
            <li><strong>Bulk Actions:</strong> Select multiple charts to share or add to setlists</li>
          </ul>
        </div>
      )
    },
    {
      title: "Sharing & Collaboration",
      description: "Work together with other musicians",
      icon: Share2,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Share with collaborators:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Email Sharing:</strong> Add specific people by email</li>
            <li><strong>Permissions:</strong> Choose view-only or edit access per person</li>
            <li><strong>See Shared Charts:</strong> View in the "Shared with me" section</li>
            <li><strong>Bulk Sharing:</strong> Share multiple charts at once</li>
          </ul>
        </div>
      )
    },
    {
      title: "You're Ready!",
      description: "Start creating amazing charts",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p>You now know the basics of ChartScribe AI. Start creating charts, organizing setlists, and collaborating with other musicians!</p>
          <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 text-sm">
            <p><strong>Pro Tip:</strong> Press <strong>⌘N</strong> to create a new chart, <strong>⌘K</strong> to search, or <strong>?</strong> to see all shortcuts</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-white text-xl">{currentStep.title}</DialogTitle>
              <DialogDescription className="text-[#6b6b6b]">{currentStep.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStep.content}
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-1 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${idx <= step ? 'bg-red-600' : 'bg-[#2a2a2a]'}`}
            />
          ))}
        </div>

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="shadow-lg shadow-red-600/20"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="shadow-lg shadow-red-600/20 w-full"
            >
              Get Started
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}