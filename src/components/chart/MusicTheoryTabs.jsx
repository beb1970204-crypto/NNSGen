import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, BookOpen, Lightbulb, Music, Ear, Download, Zap, TrendingUp, Users, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
    if (!sectionData) return;
    setQuizLoading(true);
    try {
      const response = await base44.functions.invoke('musicTheoryQuiz', {
        chartData,
        sectionData
      });
      if (response.data?.success) {
        setQuizData(response.data.questions);
      }
    } catch (error) {
      console.error('Quiz error:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!selectedMeasure || selectedMeasureIndex === null) return;
    setSuggestLoading(true);
    try {
      const response = await base44.functions.invoke('chordSuggestions', {
        chartData,
        sectionData,
        measureIndex: selectedMeasureIndex
      });
      if (response.data?.success) {
        setSuggestData(response.data.suggestions);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setSuggestLoading(false);
    }
  };

  const loadVoicing = async () => {
    if (!selectedMeasure) return;
    setVoicingLoading(true);
    try {
      const response = await base44.functions.invoke('voicingTips', {
        chartData,
        chord: selectedMeasure.chords[0].chord,
        instrument: 'guitar',
        context: sectionData?.label
      });
      if (response.data?.success) {
        setVoicingData(response.data.voicing);
      }
    } catch (error) {
      console.error('Voicing error:', error);
    } finally {
      setVoicingLoading(false);
    }
  };

  const loadEarTraining = async () => {
    if (!sectionData) return;
    setEarTrainingLoading(true);
    try {
      const response = await base44.functions.invoke('earTrainingGuide', {
        chartData,
        sectionData
      });
      if (response.data?.success) {
        setEarTrainingData(response.data.guide);
      }
    } catch (error) {
      console.error('Ear training error:', error);
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
    if (!sectionData) return;
    setAnalysisLoading(true);
    try {
      const response = await base44.functions.invoke('comparativeAnalysis', {
        chartData,
        sectionData,
        genre: chartData.genres || 'general'
      });
      if (response.data?.success) {
        setAnalysisData(response.data.analysis);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadPractice = async () => {
    if (!sectionData) return;
    setPracticeLoading(true);
    try {
      const response = await base44.functions.invoke('practiceRecommendations', {
        chartData,
        sectionData,
        skillLevel: 'intermediate'
      });
      if (response.data?.success) {
        setPracticeData(response.data.practice);
      }
    } catch (error) {
      console.error('Practice error:', error);
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
          <div className="flex flex-col gap-4">
            {!quizData ? (
              <Button onClick={loadQuiz} disabled={quizLoading || !sectionData} className="bg-[#D0021B]">
                {quizLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Generate Quiz
              </Button>
            ) : (
              <div className="space-y-3">
                {quizData.map((q, idx) => (
                  <div key={idx} className="bg-[#252525] p-3 rounded-lg text-sm space-y-2">
                    <p className="text-white font-semibold">{q.question}</p>
                    {q.options?.map((opt, i) => <p key={i} className="text-[#a0a0a0] text-xs">• {opt}</p>)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'suggest':
        return (
          <div className="flex flex-col gap-4">
            {!suggestData ? (
              <Button onClick={loadSuggestions} disabled={suggestLoading || !selectedMeasure} className="bg-[#D0021B]">
                {suggestLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Get Suggestions
              </Button>
            ) : (
              <div className="space-y-2">
                {suggestData.map((s, idx) => (
                  <div key={idx} className="bg-[#252525] p-3 rounded-lg">
                    <p className="text-white font-semibold text-sm">{s.chord}</p>
                    <p className="text-[#a0a0a0] text-xs">{s.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex flex-col gap-4">
            {!voicingData ? (
              <Button onClick={loadVoicing} disabled={voicingLoading || !selectedMeasure} className="bg-[#D0021B]">
                {voicingLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Suggest Voicing
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-white font-semibold text-sm">{voicingData.voicing}</p>
                <p className="text-[#a0a0a0] text-xs">{voicingData.tips}</p>
              </div>
            )}
          </div>
        );

      case 'ear':
        return (
          <div className="flex flex-col gap-4">
            {!earTrainingData ? (
              <Button onClick={loadEarTraining} disabled={earTrainingLoading || !sectionData} className="bg-[#D0021B]">
                {earTrainingLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Generate Guide
              </Button>
            ) : (
              <div className="text-sm text-[#a0a0a0]">
                <ReactMarkdown>{earTrainingData}</ReactMarkdown>
              </div>
            )}
          </div>
        );

      case 'arrange':
        return (
          <div className="flex flex-col gap-4">
            {!arrangementData ? (
              <Button onClick={loadArrangement} disabled={arrangementLoading || !sectionData} className="bg-[#D0021B]">
                {arrangementLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Arrange
              </Button>
            ) : (
              <div className="space-y-2 text-xs">
                {['drums', 'bass', 'keys', 'guitar'].map(inst => (
                  <div key={inst} className="bg-[#252525] p-2 rounded">
                    <p className="text-white font-semibold capitalize">{inst}</p>
                    <p className="text-[#a0a0a0]">{arrangementData[inst]?.tips}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'modulate':
        return (
          <div className="flex flex-col gap-3">
            <Input
              value={modulationTargetKey}
              onChange={(e) => setModulationTargetKey(e.target.value)}
              placeholder="Target key (e.g., G, Am)"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b] text-sm"
            />
            {!modulationData ? (
              <Button onClick={loadModulation} disabled={modulationLoading || !modulationTargetKey} className="bg-[#D0021B]" size="sm">
                {modulationLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Plan
              </Button>
            ) : (
              <div className="text-xs text-[#a0a0a0] space-y-2">
                <p><strong>Strategy:</strong> {modulationData.recommendedStrategy}</p>
                {modulationData.modulationStrategies?.map((s, i) => (
                  <div key={i} className="bg-[#252525] p-2 rounded">
                    <p className="text-white">{s.approach}</p>
                    <p className="text-[#6b6b6b]">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'compare':
        return (
          <div className="flex flex-col gap-4">
            {!analysisData ? (
              <Button onClick={loadAnalysis} disabled={analysisLoading || !sectionData} className="bg-[#D0021B]">
                {analysisLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Compare
              </Button>
            ) : (
              <div className="space-y-2 text-xs">
                {analysisData.comparisons?.map((c, idx) => (
                  <div key={idx} className="bg-[#252525] p-3 rounded">
                    <p className="text-white font-semibold">{c.songTitle}</p>
                    <p className="text-[#a0a0a0]">{c.artist} • {c.genre}</p>
                    <p className="text-[#6b6b6b] italic">{c.lessonsLearned}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'practice':
        return (
          <div className="flex flex-col gap-4">
            {!practiceData ? (
              <Button onClick={loadPractice} disabled={practiceLoading || !sectionData} className="bg-[#D0021B]">
                {practiceLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Generate
              </Button>
            ) : (
              <div className="space-y-2 text-xs">
                {practiceData.exercises?.map((ex, idx) => (
                  <div key={idx} className="bg-[#252525] p-3 rounded">
                    <p className="text-white font-semibold">{ex.title}</p>
                    <p className="text-[#a0a0a0]">{ex.description}</p>
                    <p className="text-[#D0021B] font-mono mt-1">{ex.progression}</p>
                  </div>
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

  const panelContent = (
    <div className="flex flex-col h-full bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#2a2a2a]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Music className="w-4 h-4 text-[#D0021B]" />
          Music Theory
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-[#6b6b6b] hover:text-white p-1">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-40 bg-[#0a0a0a] border-r border-[#2a2a2a] overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-4">
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
                        onClick={() => setActiveFeature(feat.id)}
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
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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