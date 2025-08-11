import React from 'react';
import { Layout } from '../components/Layout';
import { TalentCard } from '../components/TalentCard';
import { mockConversationHistory } from '../data/mockData';
import { History, Calendar, MessageCircle, Users, Mic, Volume2, Wifi } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  // WebRTC対話の判定（メッセージのmetadataに基づく）
  const isWebRTCConversation = (message: any) => {
    return message.metadata?.eventType || message.transcription;
  };

  // 対話タイプの表示名を取得
  const getConversationTypeLabel = (conversation: any) => {
    const hasWebRTCMessages = conversation.messages.some((msg: any) => isWebRTCConversation(msg));
    return hasWebRTCMessages ? 'リアルタイム音声対話' : 'テキスト対話';
  };

  // 対話タイプのアイコンを取得
  const getConversationTypeIcon = (conversation: any) => {
    const hasWebRTCMessages = conversation.messages.some((msg: any) => isWebRTCConversation(msg));
    return hasWebRTCMessages ? <Wifi className="text-green-600" size={16} /> : <MessageCircle className="text-indigo-600" size={16} />;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <History className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">相談履歴</h1>
          </div>
          <p className="text-gray-600">
            過去の相談内容と推薦された人材を確認できます。テキスト対話とリアルタイム音声対話の履歴を管理します。
          </p>
        </div>

        <div className="space-y-6">
          {mockConversationHistory.map((conversation) => (
            <div key={conversation.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getConversationTypeIcon(conversation)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {conversation.consultantName}との相談
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        getConversationTypeLabel(conversation) === 'リアルタイム音声対話'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {getConversationTypeLabel(conversation)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Calendar size={16} />
                  <span className="text-sm">
                    {conversation.date.toLocaleDateString('ja-JP')}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">会話内容</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-40 overflow-y-auto">
                  {conversation.messages.slice(0, 4).map((message) => (
                    <div
                      key={message.id}
                      className={`text-sm ${
                        message.type === 'user' ? 'text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-1">
                          <span className="font-medium">
                            {message.type === 'user' ? 'あなた' : conversation.consultantName}:
                          </span>{' '}
                          {message.content}
                        </div>
                        {isWebRTCConversation(message) && (
                          <div className="flex items-center space-x-1 mt-0.5">
                            {message.transcription ? (
                              <Mic className="text-green-500" size={12} />
                            ) : (
                              <Volume2 className="text-blue-500" size={12} />
                            )}
                          </div>
                        )}
                      </div>
                      {/* WebRTC メタデータ表示 */}
                      {isWebRTCConversation(message) && (
                        <div className="mt-1 pl-2 text-xs text-gray-500">
                          {message.transcription && (
                            <span>音声認識済み</span>
                          )}
                          {message.metadata?.audioFormat && (
                            <span className="ml-2">
                              フォーマット: {message.metadata.audioFormat}
                            </span>
                          )}
                          {message.metadata?.duration && (
                            <span className="ml-2">
                              {Math.round(message.metadata.duration)}秒
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {conversation.messages.length > 4 && (
                    <div className="text-sm text-gray-500 italic">
                      ...他 {conversation.messages.length - 4} 件のメッセージ
                    </div>
                  )}
                </div>
              </div>

              {conversation.recommendedTalents.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="text-indigo-600" size={18} />
                    <h4 className="font-medium text-gray-900">推薦された人材</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conversation.recommendedTalents.map((talent) => (
                      <TalentCard key={talent.id} talent={talent} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {mockConversationHistory.length === 0 && (
          <div className="text-center py-12">
            <History className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              まだ相談履歴がありません
            </h3>
            <p className="text-gray-600">
              コンサルタントに相談すると、ここに履歴が表示されます。
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};