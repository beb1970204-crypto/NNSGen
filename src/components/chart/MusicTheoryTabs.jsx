import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, BookOpen, Lightbulb, Music, Ear, Download, Zap, TrendingUp, Users, Maximize2, Minimize2, ChevronDown, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import FeatureEmptyState from './FeatureEmptyState';
import ResultCard from './ResultCard';

const FEATURE_GROUPS = {
  learning: {
    label: 'Learning',
    icon: BookOpen,
    color: 'text-blue-400',
    features: [
      { id: 'chat', label: 'Chat', icon: BookOpen, desc: 'Ask the professor questions' },
      { id: 'quiz', label: 'Quiz', icon: Music, desc: 'Test your knowledge' },
      { id: 'practice', label: 'Practice', icon: Music, desc: 'Targeted exercises' }
    ]
  },
  analysis: {
    label: 'Analysis',
    icon: Lightbulb,
    color: 'text-yellow-400',
    features: [
      { id: 'suggest', label: 'Suggest', icon: Lightbulb, desc: 'Chord alternatives' },
      { id: 'voice', label: 'Voice', icon: Music, desc: 'Voicing ideas' },
      { id: 'ear', label: 'Ear', icon: Ear, desc: 'Ear training' }
    ]
  },
  composition: {
    label: 'Composition',
    icon: TrendingUp,
    color: 'text-purple-400',
    features: [
      { id: 'arrange', label: 'Arrange', icon: Zap, desc: 'Arrangement guidance' },
      { id: 'modulate', label: 'Modulate', icon: TrendingUp, desc: 'Key changes' },
      { id: 'compare', label: 'Compare', icon: Users, desc: 'Famous songs' }
    ]
  }
};

export default function MusicTheoryTabs({
  isOpen,
  onClose,
  chartData,
  sectionData,
  selectedMeasure,
  selectedMeasureIndex
}) {
  const [expandedGroups, setExpandedGroups] = useState({
    learning: true,
    analysis: true,
    composition: false
  });
  const [activeFeature, setActiveFeature] = useState('chat');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hey! I\'m your music theory professor. Ask me anything about this chord chart.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // State for all features
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [suggestData, setSuggestData] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [voicingData, setVoicingData] = useState(null);
  const [voicingLoading, setVoicingLoading] = useState(false);
  const [earTrainingData, setEarTrainingData] = useState(null);
  const [earTrainingLoading, setEarTrainingLoading] = useState(false);
  const [arrangementData, setArrangementData] = useState(null);
  const [arrangementLoading, setArrangementLoading] = useState(false);
  const [modulationData, setModulationData] = useState(null);
  const [modulationLoading, setModulationLoading] = useState(false);
  const [modulationTargetKey, setModulationTargetKey] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [practiceData, setPracticeData] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(isFullscreen);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!userInput.trim()) return;
    setChatLoading(true);
    setChatMessages(prev => [...prev, { role: 'user', content: userInput }]);
    
    try {
      const response = await base44.functions.invoke('musicTheoryProfessor', {
        chartData,
        sectionData,
        selectedMeasure,
        userMessage: userInput
      });
      if (response.data?.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setUserInput('');
      setChatLoading(false);
    }
  };

  const loadQuiz = async () => {
    if (!chartData) return;
    setQuizLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('musicTheoryQuiz', {
        chartData
      });
      if (response.data?.success && response.data?.questions) {
        setQuizData(response.data.questions);
      } else {
        setErrorMessage('Failed to load quiz');
        toast.error('Failed to load quiz');
      }
    } catch (error) {
      console.error('Quiz error:', error);
      setErrorMessage(error.message || 'Failed to load quiz');
      toast.error('Failed to load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!selectedMeasure || selectedMeasureIndex === null) return;
    setSuggestLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('chordSuggestions', {
        chartData,
        sectionData,
        measureIndex: selectedMeasureIndex
      });
      if (response.data?.success && response.data?.substitutions) {
        setSuggestData(response.data.substitutions);
      } else {
        setErrorMessage('Failed to load chord suggestions');
        toast.error('Failed to load chord suggestions');
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      setErrorMessage(error.message || 'Failed to load suggestions');
      toast.error('Failed to load suggestions');
    } finally {
      setSuggestLoading(false);
    }
  };

  const loadVoicing = async () => {
    if (!selectedMeasure) return;
    setVoicingLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('voicingTips', {
        chartData,
        chord: selectedMeasure.chords[0].chord,
        instrument: 'guitar',
        context: sectionData?.label
      });
      if (response.data?.success && response.data?.voicings) {
        setVoicingData(response.data.voicings);
      } else {
        setErrorMessage('Failed to load voicing suggestions');
        toast.error('Failed to load voicing suggestions');
      }
    } catch (error) {
      console.error('Voicing error:', error);
      setErrorMessage(error.message || 'Failed to load voicings');
      toast.error('Failed to load voicings');
    } finally {
      setVoicingLoading(false);
    }
  };

  const loadEarTraining = async () => {
    if (!chartData) return;
    setEarTrainingLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('earTrainingGuide', {
        chartData
      });
      if (response.data?.success) {
        const guide = response.data.guide;
        if (typeof guide === 'object') {
          setEarTrainingData(JSON.stringify(guide, null, 2));
        } else {
          setEarTrainingData(guide);
        }
      } else {
        setErrorMessage('Failed to load ear training guide');
        toast.error('Failed to load ear training guide');
      }
    } catch (error) {
      console.error('Ear training error:', error);
      setErrorMessage(error.message || 'Failed to load ear training');
      toast.error('Failed to load ear training');
    } finally {
      setEarTrainingLoading(false);
    }
  };

  const loadArrangement = async () => {
    if (!sectionData) return;
    setArrangementLoading(true);
    try {
      const response = await base44.functions.invoke('arrangementGuidance', {
        chartData,
        sectionData
      });
      if (response.data?.success) {
        setArrangementData(response.data.arrangement);
      }
    } catch (error) {
      console.error('Arrangement error:', error);
    } finally {
      setArrangementLoading(false);
    }
  };

  const loadModulation = async () => {
    if (!modulationTargetKey) return;
    setModulationLoading(true);
    try {
      const response = await base44.functions.invoke('modulationPlanning', {
        chartData,
        currentKey: chartData.key,
        targetKey: modulationTargetKey,
        context: sectionData?.label || 'general'
      });
      if (response.data?.success) {
        setModulationData(response.data.modulation);
      }
    } catch (error) {
      console.error('Modulation error:', error);
    } finally {
      setModulationLoading(false);
    }
  };

  const loadAnalysis = async () => {
    if (!chartData) return;
    setAnalysisLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('comparativeAnalysis', {
        chartData,
        genre: chartData.genres || 'general'
      });
      if (response.data?.success && response.data?.comparisons) {
        setAnalysisData(response.data);
      } else {
        setErrorMessage('Failed to load comparative analysis');
        toast.error('Failed to load comparative analysis');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setErrorMessage(error.message || 'Failed to load analysis');
      toast.error('Failed to load analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadPractice = async () => {
    if (!chartData) return;
    setPracticeLoading(true);
    setErrorMessage(null);
    try {
      const response = await base44.functions.invoke('practiceRecommendations', {
        chartData,
        skillLevel: 'intermediate'
      });
      if (response.data?.success && response.data?.exercises) {
        setPracticeData(response.data);
      } else {
        setErrorMessage('Failed to load practice recommendations');
        toast.error('Failed to load practice recommendations');
      }
    } catch (error) {
      console.error('Practice error:', error);
      setErrorMessage(error.message || 'Failed to load practice recommendations');
      toast.error('Failed to load practice recommendations');
    } finally {
      setPracticeLoading(false);
    }
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'chat':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg p-3 ${msg.role === 'user' ? 'bg-[#D0021B] text-white' : 'bg-[#252525] text-[#a0a0a0]'}`}>
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask a question..."
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b]"
              />
              <Button onClick={sendChatMessage} disabled={chatLoading} size="icon" className="bg-[#D0021B]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="flex flex-col gap-4 h-full">
            {!quizData ? (
              <FeatureEmptyState
                icon={Music}
                title="Music Theory Quiz"
                description="Test your understanding of the entire song's harmony and progressions"
                expectedOutput="5-10 progressive questions covering all sections"
                requirements={[
                  { label: 'Chart loaded', unmet: !chartData, hint: 'Open a chart to begin' }
                ]}
                isLoading={quizLoading}
                onAction={loadQuiz}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto pb-4">
                {quizData.map((q, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-[#6b6b6b] uppercase">Q{idx + 1}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          q.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                          q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">{q.question}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {q.hints?.map((hint, hIdx) => (
                        <div key={hIdx} className="text-xs text-[#a0a0a0] bg-[#0a0a0a] p-2 rounded border-l-2 border-[#D0021B]">
                          💡 {hint}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                        <button
                          key={letter}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: letter }))}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                            quizAnswers[idx] === letter
                              ? 'bg-[#D0021B] text-white font-medium'
                              : 'bg-[#252525] text-[#a0a0a0] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          <span className="font-bold">{letter})</span> {q.options?.[optIdx] || `Option ${letter}`}
                        </button>
                      ))}
                    </div>

                    {quizAnswers[idx] && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded p-3 text-xs text-green-400">
                        <p className="font-semibold mb-1">Your Answer: {quizAnswers[idx]}</p>
                        <p className="text-green-300">{q.answer}</p>
                        <p className="text-green-300/80 mt-2 italic">💡 {q.teachingPoint}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-xs text-[#a0a0a0]">
                  <span className="font-semibold text-white">{Object.keys(quizAnswers).length}/{quizData.length}</span> answered
                </div>
              </div>
            )}
          </div>
        );

      case 'suggest':
        return (
          <div className="flex flex-col gap-4 h-full">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs text-red-400">{errorMessage}</div>
              </div>
            )}
            {!suggestData ? (
              <FeatureEmptyState
                icon={Lightbulb}
                title="Chord Suggestions"
                description="Find alternative voicings and substitutions for any chord"
                expectedOutput="3-5 chord alternatives with harmonic reasons"
                requirements={[
                  { label: 'Measure selected', unmet: !selectedMeasure, hint: 'Click a chord in the chart' }
                ]}
                isLoading={suggestLoading}
                onAction={loadSuggestions}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {suggestData.map((s, idx) => (
                  <ResultCard
                    key={idx}
                    title={s.suggested || s.chord}
                    subtitle={`Type: ${s.type || 'Substitution'}`}
                    content={s.suggested || s.chord}
                    copyText={s.suggested || s.chord}
                    details={[s.reasoning, s.musicEffect].filter(Boolean)}
                    badge={idx === 0 ? 'Recommended' : undefined}
                    color="text-[#D0021B] font-bold"
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex flex-col gap-4 h-full">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs text-red-400">{errorMessage}</div>
              </div>
            )}
            {!voicingData ? (
              <FeatureEmptyState
                icon={Music}
                title="Voicing Tips"
                description="Get instrument-specific voicing suggestions"
                expectedOutput="Shell voicing, comping patterns, and voice leading tips"
                requirements={[
                  { label: 'Measure selected', unmet: !selectedMeasure, hint: 'Click a chord in the chart' }
                ]}
                isLoading={voicingLoading}
                onAction={loadVoicing}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {Array.isArray(voicingData) ? (
                  voicingData.map((v, idx) => (
                    <ResultCard
                      key={idx}
                      title={v.name}
                      content={v.notes}
                      copyText={v.notes}
                      details={[v.description, `Technique: ${v.technique}`, `When: ${v.context}`]}
                      badge={v.difficulty}
                      color="text-[#D0021B] font-mono text-lg font-bold"
                    />
                  ))
                ) : (
                  <ResultCard
                    title={voicingData.name || 'Suggested Voicing'}
                    content={voicingData.notes || voicingData.voicing}
                    copyText={voicingData.notes || voicingData.voicing}
                    details={[voicingData.description || voicingData.tips, `Context: ${voicingData.context || 'Jazz/contemporary'}`]}
                    badge="Guitar"
                    color="text-[#D0021B] font-mono text-lg font-bold"
                  />
                )}
              </div>
            )}
          </div>
        );

      case 'ear':
        return (
          <div className="flex flex-col gap-4 h-full">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs text-red-400">{errorMessage}</div>
              </div>
            )}
            {!earTrainingData ? (
              <FeatureEmptyState
                icon={Ear}
                title="Ear Training Guide"
                description="Learn to hear and recognize the harmonic movements in the entire song"
                expectedOutput="8-12 targeted listening exercises covering all sections"
                requirements={[
                  { label: 'Chart loaded', unmet: !chartData, hint: 'Open a chart to begin' }
                ]}
                isLoading={earTrainingLoading}
                onAction={loadEarTraining}
              />
            ) : (
              <div className="text-sm text-[#a0a0a0] overflow-y-auto space-y-3">
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*]:mb-3 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-white [&>ul]:list-disc [&>ul]:ml-4">
                  {earTrainingData}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );

      case 'arrange':
        return (
          <div className="flex flex-col gap-4 h-full">
            {!arrangementData ? (
              <FeatureEmptyState
                icon={Zap}
                title="Arrangement Guidance"
                description="Get instrument-specific playing ideas and patterns"
                expectedOutput="Drums, bass, keys, and guitar arrangement suggestions"
                requirements={[
                  { label: 'Section selected', unmet: !sectionData, hint: 'Select a section in the chart' }
                ]}
                isLoading={arrangementLoading}
                onAction={loadArrangement}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {['drums', 'bass', 'keys', 'guitar'].map(inst => (
                  <ResultCard
                    key={inst}
                    title={inst.charAt(0).toUpperCase() + inst.slice(1)}
                    content={arrangementData[inst]?.pattern || 'N/A'}
                    details={[
                      arrangementData[inst]?.tips,
                      arrangementData[inst]?.intensity && `Intensity: ${arrangementData[inst].intensity}`
                    ].filter(Boolean)}
                    badge={inst === 'drums' ? 'Foundation' : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'modulate':
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#6b6b6b]">Target Key</label>
              <Input
                value={modulationTargetKey}
                onChange={(e) => setModulationTargetKey(e.target.value)}
                placeholder="e.g., G, Am, F#m"
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b] text-sm"
              />
            </div>
            {!modulationData ? (
              <FeatureEmptyState
                icon={TrendingUp}
                title="Modulation Planning"
                description="Find smooth key change strategies"
                expectedOutput="3-4 modulation approaches with pivot chords and placement"
                requirements={[
                  { label: 'Section selected', unmet: !sectionData, hint: 'Select a section in the chart' },
                  { label: 'Target key entered', unmet: !modulationTargetKey, hint: 'Enter the key to modulate to' }
                ]}
                isLoading={modulationLoading}
                onAction={loadModulation}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                <ResultCard
                  title={`${chartData.key} → ${modulationTargetKey}`}
                  content={modulationData.recommendedStrategy}
                  badge="Recommended"
                />
                {modulationData.modulationStrategies?.map((s, i) => (
                  <ResultCard
                    key={i}
                    title={s.approach}
                    content={s.pivotChord || 'N/A'}
                    copyText={s.pivotChord || ''}
                    details={[s.description, `Placement: ${s.placement || 'Bridge/Chorus'}`]}
                    color="text-[#D0021B] font-mono font-bold"
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'compare':
        return (
          <div className="flex flex-col gap-4 h-full">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs text-red-400">{errorMessage}</div>
              </div>
            )}
            {!analysisData ? (
              <FeatureEmptyState
                icon={Users}
                title="Comparative Analysis"
                description="See how famous songs use similar chord progressions as your entire chart"
                expectedOutput="5-8 famous songs with harmonic similarities and lessons"
                requirements={[
                  { label: 'Chart loaded', unmet: !chartData, hint: 'Open a chart to begin' }
                ]}
                isLoading={analysisLoading}
                onAction={loadAnalysis}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {analysisData.comparisons?.map((c, idx) => (
                  <ResultCard
                    key={idx}
                    title={c.songTitle}
                    subtitle={c.artist}
                    content={`Genre: ${c.genre}`}
                    details={[
                      `Similarity: ${c.similarity || 'High'}`,
                      c.lessonsLearned
                    ]}
                    badge={idx === 0 ? 'Closest match' : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'practice':
        return (
          <div className="flex flex-col gap-4 h-full">
            {errorMessage && (
              <div className="bg-red-500/20 border border-red-500/50 rounded p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs text-red-400">{errorMessage}</div>
              </div>
            )}
            {!practiceData ? (
              <FeatureEmptyState
                icon={Music}
                title="Practice Recommendations"
                description="Get targeted exercises to master the entire song"
                expectedOutput="6-8 progressive exercises building complete mastery"
                requirements={[
                  { label: 'Chart loaded', unmet: !chartData, hint: 'Open a chart to begin' }
                ]}
                isLoading={practiceLoading}
                onAction={loadPractice}
              />
            ) : (
              <div className="space-y-3 overflow-y-auto">
                {practiceData.exercises?.map((ex, idx) => (
                  <ResultCard
                    key={idx}
                    title={ex.title}
                    subtitle={`Duration: ${ex.duration || '5 min'}`}
                    content={ex.progression}
                    copyText={ex.progression}
                    details={ex.description}
                    badge={idx === 0 ? 'Start here' : undefined}
                    color="text-[#D0021B] font-mono font-bold"
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const SidebarContent = () => (
    <div className="p-3 space-y-3">
      {Object.entries(FEATURE_GROUPS).map(([groupId, group]) => (
        <div key={groupId}>
          <button
            onClick={() => toggleGroup(groupId)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[#6b6b6b] hover:text-white px-2 py-2 rounded transition-colors"
          >
            <span className="flex items-center gap-2">
              <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
              {group.label}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${expandedGroups[groupId] ? 'rotate-180' : ''}`} />
          </button>

          {expandedGroups[groupId] && (
            <div className="space-y-1 mt-2">
              {group.features.map(feat => (
                <button
                  key={feat.id}
                  onClick={() => {
                    setActiveFeature(feat.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors ${
                    activeFeature === feat.id
                      ? 'bg-[#D0021B] text-white'
                      : 'text-[#a0a0a0] hover:bg-[#252525] hover:text-white'
                  }`}
                  title={feat.desc}
                >
                  {feat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const panelContent = (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2a2a2a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Music className="w-4 h-4 text-[#D0021B] flex-shrink-0" />
          {isFullscreen && <h2 className="text-sm font-bold text-white truncate">Music Theory</h2>}
          {!isFullscreen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center gap-1.5 text-[#6b6b6b] hover:text-white transition-colors text-xs font-medium flex-1 min-w-0"
            >
              <span className="truncate">{FEATURE_GROUPS[Object.keys(FEATURE_GROUPS).find(g => 
                FEATURE_GROUPS[g].features.some(f => f.id === activeFeature)
              )]?.label || 'Tools'}</span>
              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          {isFullscreen && <h2 className="hidden lg:block text-sm font-bold text-white">Music Theory</h2>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-[#6b6b6b] hover:text-white p-1" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white p-1" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar - only show on fullscreen or lg screens */}
        {(isFullscreen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <div className="w-48 bg-[#0a0a0a] border-r border-[#2a2a2a] overflow-y-auto flex-shrink-0">
            <SidebarContent />
          </div>
        )}

        {/* Mobile Sidebar Dropdown */}
        {sidebarOpen && !isFullscreen && (
          <div className="absolute left-0 top-full w-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto mt-1">
            <SidebarContent />
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3">
          {renderFeatureContent()}
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80">
        <div className="h-full max-w-5xl mx-auto">
          {panelContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 shadow-2xl z-40">
      {panelContent}
    </div>
  );
}