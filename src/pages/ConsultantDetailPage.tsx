import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { TalentCard } from '../components/TalentCard';
import { consultants } from '../data/consultants';
import { mockTalents, questionFlow, hotReadingResponses, coldReadingResponses, subsidyRecommendations, finalSummary, userResponses } from '../data/mockData';
import { Message } from '../types';
import { Send, User, Bot, Mic, MicOff, Volume2, Phone, PhoneOff } from 'lucide-react';

export const ConsultantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<'questions' | 'hot-reading' | 'cold-reading' | 'subsidies' | 'summary' | 'recommendations'>('questions');
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [subsidyIndex, setSubsidyIndex] = useState(0);
  const [audioIndex, setAudioIndex] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isConversationStarted, setIsConversationStarted] = useState(false);

  const consultant = consultants.find(c => c.id === id);

  // 音声ファイルを再生する関数
  const playAudioFile = (audioNumber?: number) => {
    const currentAudioIndex = audioNumber || audioIndex;
    const audioFileName = `${currentAudioIndex.toString().padStart(3, '0')}.wav`;
    const audioPath = `/${audioFileName}`;
    
    console.log('音声ファイル再生開始:', audioPath, 'currentAudioIndex:', currentAudioIndex);
    
    // 既存の音声を停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // 新しい音声を作成して再生
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    
    audio.onloadstart = () => {
      console.log('音声ファイル読み込み開始');
      setIsSpeaking(true);
    };
    
    audio.onended = () => {
      console.log('音声ファイル再生終了');
      setIsSpeaking(false);
    };
    
    audio.onerror = (event) => {
      console.error('音声ファイル再生エラー:', event);
      setIsSpeaking(false);
    };
    
    audio.play().catch(error => {
      console.error('音声再生に失敗:', error);
      setIsSpeaking(false);
    });
  };

  // 音声を停止する関数
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log('音声再生を停止しました');
      setIsSpeaking(false);
    }
  };

  const handleStartCall = () => {
    setIsConversationStarted(true);
    console.log('通話開始 - 初回音声再生');
    playAudioFile(1);
  };

  // 初回メッセージと音声再生
  useEffect(() => {
    if (consultant && messages.length === 0 && !hasSpokenWelcome) {
      console.log('初回メッセージを設定中...');
      // 初回の挨拶メッセージ
      const welcomeMessage: Message = {
        id: '1',
        type: 'consultant',
        content: `${questionFlow[0]}`,
        timestamp: new Date(),
        isAudio: true
      };
      setMessages([welcomeMessage]);
      setHasSpokenWelcome(true);
    }
  }, [consultant, messages.length, hasSpokenWelcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      isAudio: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // 次の音声ファイルのインデックスを更新
    setAudioIndex(prev => prev + 1);

    // AIの応答を生成
    setTimeout(() => {
      generateAIResponse();
    }, 1000);
  };

  const generateAIResponse = () => {
    let responseContent = '';

    if (phase === 'questions') {
      if (currentQuestionIndex < questionFlow.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        responseContent = questionFlow[nextIndex];
        setCurrentQuestionIndex(nextIndex);
      } else {
        // 質問フェーズ終了、ホットリーディングへ
        responseContent = hotReadingResponses[Math.floor(Math.random() * hotReadingResponses.length)];
        setPhase('hot-reading');
      }
    } else if (phase === 'hot-reading') {
      responseContent = coldReadingResponses[Math.floor(Math.random() * coldReadingResponses.length)];
      setPhase('cold-reading');
    } else if (phase === 'cold-reading') {
      responseContent = subsidyRecommendations[0];
      setPhase('subsidies');
      setSubsidyIndex(0);
    } else if (phase === 'subsidies') {
      if (subsidyIndex < subsidyRecommendations.length - 1) {
        const nextIndex = subsidyIndex + 1;
        responseContent = subsidyRecommendations[nextIndex];
        setSubsidyIndex(nextIndex);
      } else {
        responseContent = finalSummary;
        setPhase('summary');
      }
    } else if (phase === 'summary') {
      responseContent = 'それでは、あなたの課題解決に最適な人材をご紹介させていただきます。以下の方々がおすすめです。';
      setPhase('recommendations');
    } else if (phase === 'cold-reading') {
      responseContent = 'それでは、あなたの課題解決に最適な人材をご紹介させていただきます。以下の方々がおすすめです。';
      setPhase('recommendations');
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      type: 'consultant',
      content: responseContent,
      timestamp: new Date(),
      isAudio: true
    };

    setMessages(prev => [...prev, aiMessage]);

    // AIの応答を音声で読み上げ
    const nextAudioIndex = audioIndex + 1;
    setAudioIndex(nextAudioIndex);
    setTimeout(() => {
      playAudioFile(nextAudioIndex);
    }, 800);
  };

  const handleVoiceInput = () => {
    setIsRecording(true);
    // モック: 2秒後に音声入力を終了し、サンプルテキストを返す
    setTimeout(() => {
      setIsRecording(false);
      // 現在のフェーズに応じた適切な回答を返す
      let response = '';
      if (phase === 'questions' && currentQuestionIndex < userResponses.length) {
        response = userResponses[currentQuestionIndex];
      } else {
        response = "とても参考になります！まずは『ものづくり補助金』の申請書作成に取りかかります。";
      }
      handleSendMessage(response);
    }, 2000);
  };

  if (!consultant) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">コンサルタントが見つかりません</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* コンサルタント情報ヘッダー */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={consultant.avatar}
              alt={consultant.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{consultant.name}</h1>
              <p className="text-gray-600 mb-4">{consultant.experience}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">得意分野</h3>
                  <div className="flex flex-wrap gap-2">
                    {consultant.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">保有人脈</h3>
                  <p className="text-gray-600 text-sm">{consultant.connections}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: ビデオ通話エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm h-[600px] flex flex-col">
              {/* ビデオ画面 */}
              <div className="relative bg-gray-900 rounded-t-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {!isConversationStarted ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <button
                      onClick={handleStartCall}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <Phone size={24} />
                      <span>通話を開始</span>
                    </button>
                  </div>
                ) : (
                  <img
                    src={consultant.avatar}
                    alt={consultant.name}
                    className="w-full h-full object-cover object-center"
                  />
                )}

                {/* 通話状態インジケーター */}
                {isConversationStarted && (
                  <div className="absolute top-4 left-4">
                  <div className="flex items-center space-x-2 bg-black bg-opacity-50 rounded-full px-3 py-1">
                    <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-white text-sm">
                      {isCallActive ? '通話中' : '切断'}
                    </span>
                  </div>
                  </div>
                )}

                {/* 音声出力インジケーター */}
                {isConversationStarted && isSpeaking && (
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2 bg-blue-500 bg-opacity-80 rounded-full px-3 py-1">
                      <Volume2 className="text-white animate-pulse" size={16} />
                      <span className="text-white text-sm">話しています</span>
                    </div>
                  </div>
                )}

                {/* 音声入力インジケーター */}
              </div>

              {/* 通話コントロール */}
              <div className="p-4 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-center space-x-4">
                  {isConversationStarted && (
                    <>
                      {/* <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                      >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button> */}

                      <button
                    onClick={handleVoiceInput}
                    disabled={isRecording}
                    className={`p-4 rounded-full transition-colors ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                      >
                    <Mic size={24} />
                      </button>

                      {/* <button
                    onClick={stopAudio}
                    disabled={!isSpeaking}
                    className={`p-3 rounded-full transition-colors ${
                      isSpeaking
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title="音声停止"
                      >
                    <Volume2 size={20} />
                      </button> */}

                      <button
                    onClick={() => setIsCallActive(!isCallActive)}
                    className={`p-3 rounded-full transition-colors ${
                      isCallActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                      >
                    {isCallActive ? <PhoneOff size={20} /> : <Phone size={20} />}
                      </button>
                    </>
                  )}
                </div>

                {isConversationStarted && isRecording && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-red-600">音声を録音中...</p>
                  </div>
                )}

                {isConversationStarted && isSpeaking && (
                  <div className="text-center mt-2">
                    <p className="text-sm text-blue-600">AIが話しています...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側: チャット履歴 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">会話履歴</h3>
              </div>

              {/* メッセージ一覧 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-2 ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {message.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[200px] px-3 py-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p>{message.content}</p>
                      {message.isAudio && (
                        <button
                          onClick={playAudioFile}
                          className="mt-1 text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center space-x-1"
                        >
                          <Volume2 size={12} />
                          <span>再生</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* テキスト入力エリア */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <button
                    onClick={() => handleSendMessage(inputText)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 人材紹介カード */}
        {phase === 'recommendations' && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">おすすめ人材</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockTalents.slice(0, 3).map((talent) => (
                <TalentCard key={talent.id} talent={talent} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};