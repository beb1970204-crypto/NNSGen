import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SetlistLearningPath() {
  const urlParams = new URLSearchParams(window.location.search);
  const setlistId = urlParams.get('id');
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(null);

  const { data: setlist } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => base44.entities.Setlist.get(setlistId),
    enabled: !!setlistId
  });

  const generatePath = async () => {
    if (!setlistId) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateLearningPath', {
        setlistId,
        skillLevel: 'intermediate'
      });
      if (response.data?.success) {
        setLearningPath(response.data.learningPath);
        setExpandedWeek(0);
      }
    } catch (error) {
      console.error('Learning path error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!setlistId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#a0a0a0]">No setlist selected</p>
          <Link to={createPageUrl('Home')}>
            <Button className="mt-4 bg-[#D0021B]">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('SetlistViewer')}
            className="text-[#a0a0a0] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{setlist?.name || 'Learning Path'}</h1>
            <p className="text-[#6b6b6b] text-sm mt-1">Structured practice curriculum</p>
          </div>
        </div>

        {!learningPath ? (
          <div className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-[#D0021B] mx-auto mb-4" />
              <p className="text-[#a0a0a0] mb-4">Generate a personalized learning path for this setlist</p>
              <Button
                onClick={generatePath}
                disabled={loading}
                className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Learning Path
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview */}
            <Card className="bg-[#141414] border-[#2a2a2a] p-6">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#D0021B]" />
                    Overall Goal
                  </h2>
                  <p className="text-[#a0a0a0]">{learningPath.overallGoal}</p>
                </div>
                <div className="pt-3 border-t border-[#2a2a2a]">
                  <p className="text-sm text-[#6b6b6b]">
                    <strong>Estimated Duration:</strong> {learningPath.estimatedDuration}
                  </p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    <strong>Concept Progression:</strong> {learningPath.conceptProgression}
                  </p>
                </div>
              </div>
            </Card>

            {/* Weekly Breakdown */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Weekly Plan</h2>
              <div className="space-y-3">
                {learningPath.weeks?.map((week, idx) => (
                  <Card
                    key={idx}
                    className="bg-[#141414] border-[#2a2a2a] p-4 cursor-pointer hover:border-[#D0021B] transition-colors"
                    onClick={() => setExpandedWeek(expandedWeek === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">Week {week.week}</h3>
                        <p className="text-[#D0021B] text-sm font-semibold mt-1">{week.theme}</p>
                        <p className="text-[#a0a0a0] text-sm mt-2">{week.focus}</p>
                      </div>
                      <div className="text-[#6b6b6b]">
                        {expandedWeek === idx ? '▼' : '▶'}
                      </div>
                    </div>

                    {expandedWeek === idx && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                        {week.songs && (
                          <div>
                            <p className="text-xs font-semibold text-[#6b6b6b] mb-2">SONGS TO FOCUS ON</p>
                            <div className="flex flex-wrap gap-2">
                              {week.songs.map((song, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-[#252525] text-[#a0a0a0] px-2 py-1 rounded"
                                >
                                  {song}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {week.practiceGoals && (
                          <div>
                            <p className="text-xs font-semibold text-[#6b6b6b] mb-2">PRACTICE GOALS</p>
                            <ul className="space-y-1">
                              {week.practiceGoals.map((goal, i) => (
                                <li key={i} className="text-xs text-[#a0a0a0] flex items-start gap-2">
                                  <span className="text-[#D0021B] mt-1">•</span>
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {week.milestones && (
                          <div>
                            <p className="text-xs font-semibold text-[#6b6b6b] mb-2">MILESTONES</p>
                            <ul className="space-y-1">
                              {week.milestones.map((milestone, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-[#a0a0a0] flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-[#D0021B]" />
                                  {milestone}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Tips */}
            {learningPath.tips && (
              <Card className="bg-[#141414] border-[#2a2a2a] p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Success Tips</h3>
                <ul className="space-y-2">
                  {learningPath.tips.map((tip, idx) => (
                    <li key={idx} className="text-[#a0a0a0] text-sm flex items-start gap-2">
                      <span className="text-[#D0021B] mt-1">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}