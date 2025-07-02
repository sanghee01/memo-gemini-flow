
import React from 'react';
import { Plus, Brain } from 'lucide-react';

interface HeaderProps {
  onCreateMemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateMemo }) => {
  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SangMemo</h1>
              <p className="text-sm text-gray-600">AI 메모 정리 서비스</p>
            </div>
          </div>
          
          <button
            onClick={onCreateMemo}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            <span>새 메모</span>
          </button>
        </div>
      </div>
    </header>
  );
};
