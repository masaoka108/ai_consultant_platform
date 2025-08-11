import React from 'react';
import { Layout } from '../components/Layout';
import { TalentCard } from '../components/TalentCard';
import { mockConversationHistory } from '../data/mockData';
import { History, Calendar, MessageCircle, Users } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <History className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">相談履歴</h1>
          </div>
          <p className="text-gray-600">
            過去の相談内容と推薦された人材を確認できます。
          </p>
        </div>

        <div className="space-y-6">
          {mockConversationHistory.map((conversation) => (
            <div key={conversation.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {conversation.consultantName}との相談
                  </h3>
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
                      <span className="font-medium">
                        {message.type === 'user' ? 'あなた' : conversation.consultantName}:
                      </span>{' '}
                      {message.content}
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