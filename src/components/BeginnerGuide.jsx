import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronRight, Music, Share2, Star, BarChart3 } from "lucide-react";

export default function BeginnerGuide({ open, onOpenChange }) {
  const [step, setStep] = React.useState(0);

  const steps = [
    {
      title: "Welcome to NNSGen",
      description: "Your AI-powered chord charting companion for musicians",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p>NNSGen helps you create, organize, and share musical chord charts with ease. Whether you're a beginner or experienced musician, we've got you covered.</p>
          <p className="text-sm italic">Let's take a quick tour!</p>
        </div>
      )
    },
    {
      title: "Creating Charts",
      description: "Start charting your favorite songs",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Two ways to create:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Chordonomicon:</strong> AI finds the chords automatically</li>
            <li><strong>Manual Entry:</strong> Add chords yourself section by section</li>
          </ul>
          <p className="text-sm"><strong>Key Settings:</strong> Choose musical key, time signature, and tempo for your chart.</p>
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
          <p className="text-sm">Switch between them anytime in the chart viewer!</p>
        </div>
      )
    },
    {
      title: "Organization",
      description: "Keep your charts organized",
      icon: Star,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Tools to organize:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Favorites:</strong> Star charts for quick access</li>
            <li><strong>Setlists:</strong> Group charts for performances</li>
            <li><strong>Search & Filter:</strong> Find by title, key, or time signature</li>
          </ul>
        </div>
      )
    },
    {
      title: "Sharing Charts",
      description: "Collaborate with other musicians",
      icon: Share2,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p><strong>Sharing options:</strong></p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Email Sharing:</strong> Add collaborators by email</li>
            <li><strong>Permission Levels:</strong> Choose view-only or edit access</li>
            <li><strong>Shareable Links:</strong> Generate secure links for sharing</li>
          </ul>
          <p className="text-sm">See who charts are shared with in the share dialog.</p>
        </div>
      )
    },
    {
      title: "You're Ready!",
      description: "Start creating amazing charts",
      icon: Music,
      content: (
        <div className="space-y-3 text-[#a0a0a0]">
          <p>You now know the basics of NNSGen. Start creating charts and collaborating with other musicians!</p>
          <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 text-sm">
            <p><strong>Pro Tip:</strong> Use keyboard shortcuts for faster editing (press ? to see all shortcuts)</p>
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