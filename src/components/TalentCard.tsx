import React from 'react';
import { TalentCard as TalentCardType } from '../types';
import { Building, User } from 'lucide-react';

interface TalentCardProps {
  talent: TalentCardType;
}

export const TalentCard: React.FC<TalentCardProps> = ({ talent }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <img
          src={talent.avatar}
          alt={talent.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <User size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">{talent.name}</h3>
          </div>
          <div className="flex items-center space-x-2 mb-3">
            <Building size={14} className="text-gray-500" />
            <p className="text-sm text-gray-600">{talent.company}</p>
          </div>
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {talent.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{talent.introduction}</p>
        </div>
      </div>
    </div>
  );
};