import React from 'react';
import { Link } from 'react-router-dom';
import { Consultant } from '../types';
import { MessageCircle, Star } from 'lucide-react';

interface ConsultantCardProps {
  consultant: Consultant;
}

export const ConsultantCard: React.FC<ConsultantCardProps> = ({ consultant }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={consultant.avatar}
            alt={consultant.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{consultant.name}</h3>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{consultant.experience}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">得意分野</h4>
          <div className="flex flex-wrap gap-2">
            {consultant.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-1">専門領域</h4>
          <p className="text-gray-600 text-sm">{consultant.expertise}</p>
        </div>
        
        <Link
          to={`/consultants/${consultant.id}`}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <MessageCircle size={16} />
          <span>相談する</span>
        </Link>
      </div>
    </div>
  );
};