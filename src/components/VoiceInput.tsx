import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onPlayAudio: (text: string) => void;
  isListening?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onVoiceInput, 
  onPlayAudio, 
  isListening = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleStartRecording = () => {
    setIsRecording(true);
    // モック: 2秒後に音声入力を終了し、サンプルテキストを返す
    setTimeout(() => {
      setIsRecording(false);
      const mockResponses = [
        "IT企業への新規営業で苦戦しています",
        "技術的な話についていけません",
        "提案書の作り方がわからない",
        "クライアントとの関係構築が難しい"
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      onVoiceInput(randomResponse);
    }, 2000);
  };

  const handlePlayAudio = (text: string) => {
    setIsPlaying(true);
    onPlayAudio(text);
    // モック: 3秒後に再生終了
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleStartRecording}
        disabled={isRecording}
        className={`p-3 rounded-full transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
        }`}
        title={isRecording ? '録音中...' : '音声入力'}
      >
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      
      {isRecording && (
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">録音中...</span>
        </div>
      )}
      
      {isPlaying && (
        <div className="flex items-center space-x-2 text-indigo-600">
          <Volume2 size={16} className="animate-pulse" />
          <span className="text-sm">再生中...</span>
        </div>
      )}
    </div>
  );
};