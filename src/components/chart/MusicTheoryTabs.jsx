import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, BookOpen, Lightbulb, Music, Ear, Download, Zap, TrendingUp, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MusicTheoryTabs({
  isOpen,
  onClose,
  chartData,
  sectionData,
  selectedMeasure,
  selectedMeasureIndex
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🎓 Hi! I\'m your music theory professor. Ask me anything about the chords, progressions, or music theory concepts in this chart!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState({});

  // Suggestions state
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Voicing state
  const [voicingData, setVoicingData] = useState(null);
  const [voicingLoading, setVoicingLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('piano');

  // Ear training state
  const [earTrainingData, setEarTrainingData] = useState(null);
  const [earTrainingLoading, setEarTrainingLoading] = useState(false);

  // Arrangement state
  const [arrangementData, setArrangementData] = useState(null);
  const [arrangementLoading, setArrangementLoading] = useState(false);

  // Modulation state
  const [modulationData, setModulationData] = useState(null);
  const [modulationLoading, setModulationLoading] = useState(false);
  const [modulationTargetKey, setModulationTargetKey] = useState('');

  // Comparative analysis state
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Practice state
  const [practiceData, setPracticeData] = useState(null);
  const [practiceLoading, setPracticeLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('musicTheoryProfessor', {
        chartData,
        sectionData,
        selectedMeasure,
        userQuestion: userMessage
      });

      if (response.data?.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.explanation
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Theory question error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I had trouble processing your question. Please try again.'
      }]);
    } finally {
      setLoading(false);
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
        setCurrentQuestionIndex(0);
        setShowAnswers({});
      }
    } catch (error) {
      console.error('Quiz error:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  const loadSuggestions = async () => {
    if (!sectionData || selectedMeasureIndex === null) return;
    setSuggestionsLoading(true);
    try {
      const response = await base44.functions.invoke('chordSuggestions', {
        chartData,
        sectionData,
        measureIndex: selectedMeasureIndex
      });
      if (response.data?.success) {
        setSuggestions(response.data.substitutions);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const loadVoicing = async () => {
    if (!selectedMeasure) return;
    setVoicingLoading(true);
    try {
      const chord = selectedMeasure.chords?.[0]?.chord || '-';
      const response = await base44.functions.invoke('voicingTips', {
        chartData,
        chord,
        instrument: selectedInstrument,
        context: sectionData?.label || 'general'
      });
      if (response.data?.success) {
        setVoicingData(response.data.voicings);
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

  const saveAnalysisNote = async () => {
    try {
      await base44.entities.ChartAnalysisNote.create({
        chart_id: chartData.id,
        title: `Analysis: ${sectionData?.label || 'Chart'}`,
        content: messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n'),
        conversation_history: messages,
        timestamp: new Date().toISOString()
      });
      alert('Analysis note saved!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save note');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#141414] border-l border-[#2a2a2a] shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <h2 className="text-sm font-semibold text-white">Music Theory</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-[#6b6b6b] hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-[#1a1a1a] border-b border-[#2a2a2a] rounded-none w-full justify-start h-auto p-0">
          <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <BookOpen className="w-4 h-4 mr-1" />
            <span className="text-xs">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Lightbulb className="w-4 h-4 mr-1" />
            <span className="text-xs">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Music className="w-4 h-4 mr-1" />
            <span className="text-xs">Suggest</span>
          </TabsTrigger>
          <TabsTrigger value="voicing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Music className="w-4 h-4 mr-1" />
            <span className="text-xs">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="ear" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Ear className="w-4 h-4 mr-1" />
            <span className="text-xs">Ear</span>
          </TabsTrigger>
          <TabsTrigger value="arrange" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Zap className="w-4 h-4 mr-1" />
            <span className="text-xs">Arrange</span>
          </TabsTrigger>
          <TabsTrigger value="modulate" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-xs">Modulate</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-xs">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D0021B]">
            <Music className="w-4 h-4 mr-1" />
            <span className="text-xs">Practice</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-[#D0021B] text-white'
                    : 'bg-[#252525] text-[#a0a0a0]'
                }`}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown className="text-sm prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#252525] rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6b6b6b]" />
                  <span className="text-sm text-[#6b6b6b]">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[#2a2a2a] p-4 space-y-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about chords..."
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b] focus:border-red-600"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="w-full bg-[#D0021B] hover:bg-[#A0011B] text-white disabled:opacity-50"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" /> Ask
            </Button>
            <Button
              onClick={saveAnalysisNote}
              variant="outline"
              className="w-full text-xs"
              size="sm"
            >
              <Download className="w-3 h-3 mr-1" /> Save as Note
            </Button>
          </div>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!quizData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">Generate harmonic analysis questions for this section</p>
                <Button
                  onClick={loadQuiz}
                  disabled={quizLoading || !sectionData}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {quizLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                  Generate Quiz
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-[#6b6b6b]">Question {currentQuestionIndex + 1} of {quizData.length}</div>
                <div className="bg-[#252525] rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      quizData[currentQuestionIndex]?.difficulty === 'easy' ? 'bg-green-600/20 text-green-400' :
                      quizData[currentQuestionIndex]?.difficulty === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>
                      {quizData[currentQuestionIndex]?.difficulty}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{quizData[currentQuestionIndex]?.question}</p>
                  
                  {!showAnswers[currentQuestionIndex] && (
                    <Button
                      onClick={() => setShowAnswers({...showAnswers, [currentQuestionIndex]: true})}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Show Answer
                    </Button>
                  )}

                  {showAnswers[currentQuestionIndex] && (
                    <div className="bg-[#1a1a1a] rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-[#D0021B]">Answer:</p>
                      <p className="text-sm text-[#a0a0a0]">{quizData[currentQuestionIndex]?.answer}</p>
                      <p className="text-xs text-[#6b6b6b] italic">{quizData[currentQuestionIndex]?.teachingPoint}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === 0}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(quizData.length - 1, currentQuestionIndex + 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIndex === quizData.length - 1}
                    className="flex-1"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!suggestions ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">
                  {selectedMeasureIndex === null ? 'Select a measure to get suggestions' : 'Get chord substitution ideas'}
                </p>
                <Button
                  onClick={loadSuggestions}
                  disabled={suggestionsLoading || selectedMeasureIndex === null}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {suggestionsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Music className="w-4 h-4 mr-2" />}
                  Get Suggestions
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((sub, idx) => (
                  <div key={idx} className="bg-[#252525] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{sub.original}</span>
                      <span className="text-[#6b6b6b]">→</span>
                      <span className="text-sm font-semibold text-[#D0021B]">{sub.suggested}</span>
                    </div>
                    <p className="text-xs bg-[#1a1a1a] rounded px-2 py-1 text-[#a0a0a0]">{sub.type}</p>
                    <p className="text-xs text-[#a0a0a0]">{sub.reasoning}</p>
                    <p className="text-xs italic text-[#6b6b6b]">Sound: {sub.musicEffect}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Voicing Tab */}
        <TabsContent value="voicing" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b6b6b] mb-2 block">Instrument</label>
                <select
                  value={selectedInstrument}
                  onChange={(e) => setSelectedInstrument(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white"
                >
                  <option value="piano">Piano</option>
                  <option value="guitar">Guitar</option>
                  <option value="bass">Bass</option>
                  <option value="vocal">Vocal</option>
                </select>
              </div>

              {!voicingData ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <p className="text-sm text-[#6b6b6b] text-center">
                    {!selectedMeasure ? 'Select a measure to get voicing tips' : 'Learn how to voice this chord'}
                  </p>
                  <Button
                    onClick={loadVoicing}
                    disabled={voicingLoading || !selectedMeasure}
                    className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                    size="sm"
                  >
                    {voicingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Music className="w-4 h-4 mr-2" />}
                    Get Voicing Tips
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {voicingData.map((voicing, idx) => (
                    <div key={idx} className="bg-[#252525] rounded-lg p-3 space-y-2">
                      <p className="text-sm font-semibold text-white">{voicing.name}</p>
                      <p className="text-xs bg-[#1a1a1a] rounded px-2 py-1 text-[#D0021B] font-mono">{voicing.notes}</p>
                      <p className="text-xs text-[#a0a0a0]">{voicing.description}</p>
                      <p className="text-xs text-[#6b6b6b]"><strong>How:</strong> {voicing.technique}</p>
                      <p className="text-xs text-[#6b6b6b]"><strong>When:</strong> {voicing.context}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Ear Training Tab */}
        <TabsContent value="ear" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!earTrainingData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">Learn to recognize this progression by ear</p>
                <Button
                  onClick={loadEarTraining}
                  disabled={earTrainingLoading || !sectionData}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {earTrainingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ear className="w-4 h-4 mr-2" />}
                  Generate Guide
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-[#252525] rounded-lg p-3">
                  <p className="text-sm font-semibold text-white mb-2">Sound Character</p>
                  <p className="text-xs text-[#a0a0a0]">{earTrainingData.soundCharacter}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#D0021B] mb-2">Listen For</p>
                  <div className="space-y-2">
                    {earTrainingData.listenFor?.map((item, idx) => (
                      <div key={idx} className="bg-[#1a1a1a] rounded p-2 border-l-2 border-[#D0021B]">
                        <p className="text-xs font-semibold text-white">{item.moment}</p>
                        <p className="text-xs text-[#a0a0a0] mt-1">{item.sound}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#D0021B] mb-2">Practice Tips</p>
                  <ul className="space-y-1 text-xs text-[#a0a0a0]">
                    {earTrainingData.practiceTips?.map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Arrangement Tab */}
        <TabsContent value="arrange" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!arrangementData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">Get arrangement ideas for each instrument</p>
                <Button
                  onClick={loadArrangement}
                  disabled={arrangementLoading || !sectionData}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {arrangementLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Arrange Section
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {['drums', 'bass', 'keys', 'guitar'].map(instrument => (
                  <div key={instrument} className="bg-[#252525] rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold text-white capitalize">{instrument}</p>
                    <p className="text-xs text-[#a0a0a0]"><strong>Pattern:</strong> {arrangementData[instrument]?.pattern}</p>
                    {instrument === 'drums' && <p className="text-xs text-[#a0a0a0]"><strong>Intensity:</strong> {arrangementData[instrument]?.intensity}</p>}
                    <p className="text-xs text-[#6b6b6b]">{arrangementData[instrument]?.tips}</p>
                  </div>
                ))}
                <div className="bg-[#1a1a1a] rounded-lg p-3 border-l-2 border-[#D0021B]">
                  <p className="text-xs text-[#a0a0a0]"><strong>Together:</strong> {arrangementData.overall}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Modulation Tab */}
        <TabsContent value="modulate" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b6b6b] mb-2 block">Target Key</label>
                <Input
                  value={modulationTargetKey}
                  onChange={(e) => setModulationTargetKey(e.target.value)}
                  placeholder="e.g., G, Am, F#m"
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-[#6b6b6b] focus:border-red-600"
                />
              </div>

              {!modulationData ? (
                <Button
                  onClick={loadModulation}
                  disabled={modulationLoading || !modulationTargetKey}
                  className="w-full bg-[#D0021B] hover:bg-[#A0011B] text-white"
                  size="sm"
                >
                  {modulationLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                  Plan Modulation
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 border-l-2 border-[#D0021B]">
                    <p className="text-xs text-[#6b6b6b]"><strong>Recommended:</strong> {modulationData.recommendedStrategy}</p>
                    <p className="text-xs text-[#6b6b6b] mt-2"><strong>Placement:</strong> {modulationData.placement}</p>
                  </div>
                  {modulationData.modulationStrategies?.map((strat, idx) => (
                    <div key={idx} className="bg-[#252525] rounded-lg p-3 space-y-2">
                      <p className="text-sm font-semibold text-white">{strat.approach}</p>
                      <p className="text-xs text-[#a0a0a0]">{strat.description}</p>
                      {strat.pivotChord && <p className="text-xs text-[#D0021B] font-mono">Pivot: {strat.pivotChord}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Comparative Analysis Tab */}
        <TabsContent value="compare" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!analysisData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">See how famous songs use similar progressions</p>
                <Button
                  onClick={loadAnalysis}
                  disabled={analysisLoading || !sectionData}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                  Analyze Comparisons
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#1a1a1a] rounded-lg p-3 border-l-2 border-[#D0021B]">
                  <p className="text-xs text-[#a0a0a0]">{analysisData.patterns}</p>
                </div>
                {analysisData.comparisons?.map((comp, idx) => (
                  <div key={idx} className="bg-[#252525] rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold text-white">{comp.songTitle}</p>
                    <p className="text-xs text-[#6b6b6b]">{comp.artist} • {comp.genre}</p>
                    <p className="text-xs text-[#a0a0a0]"><strong>Similarity:</strong> {comp.similarity}</p>
                    <p className="text-xs text-[#6b6b6b] italic">{comp.lessonsLearned}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {!practiceData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-sm text-[#6b6b6b] text-center">Get targeted practice exercises</p>
                <Button
                  onClick={loadPractice}
                  disabled={practiceLoading || !sectionData}
                  className="bg-[#D0021B] hover:bg-[#A0011B] text-white"
                >
                  {practiceLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Music className="w-4 h-4 mr-2" />}
                  Generate Exercises
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <p className="text-xs font-semibold text-white mb-2">Practice Sequence</p>
                  <p className="text-xs text-[#a0a0a0]">{practiceData.practiceSequence}</p>
                </div>
                {practiceData.exercises?.map((ex, idx) => (
                  <div key={idx} className="bg-[#252525] rounded-lg p-3 space-y-2">
                    <p className="text-sm font-semibold text-white">{ex.title}</p>
                    <p className="text-xs text-[#a0a0a0]">{ex.description}</p>
                    <p className="text-xs text-[#6b6b6b]"><strong>Duration:</strong> {ex.duration}</p>
                    <p className="text-xs text-[#D0021B] font-mono">{ex.progression}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}