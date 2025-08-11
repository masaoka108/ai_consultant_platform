import React from 'react';
import { Layout } from '../components/Layout';
import { ConsultantCard } from '../components/ConsultantCard';
import { consultants } from '../data/consultants';
import { Users } from 'lucide-react';

export const ConsultantsPage: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Users className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">AIコンサルタント一覧</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            営業のプロフェッショナルがあなたの課題解決をサポートします。
            専門分野や経験に基づいて、最適なコンサルタントをお選びください。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((consultant) => (
            <ConsultantCard key={consultant.id} consultant={consultant} />
          ))}
        </div>
      </div>
    </Layout>
  );
};