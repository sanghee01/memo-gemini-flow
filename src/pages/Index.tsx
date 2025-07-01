
import React, { useState } from 'react';
import { MemoList } from '@/components/MemoList';
import { MemoEditor } from '@/components/MemoEditor';
import { MemoViewer } from '@/components/MemoViewer';
import { Header } from '@/components/Header';
import { Memo } from '@/types/memo';

const Index = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const handleCreateMemo = () => {
    const newMemo: Memo = {
      id: Date.now().toString(),
      title: '',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOrganized: false
    };
    setMemos([newMemo, ...memos]);
    setSelectedMemo(newMemo);
    setIsEditing(true);
    setIsViewing(false);
  };

  const handleSaveMemo = (memo: Memo) => {
    const updatedMemos = memos.map(m => m.id === memo.id ? memo : m);
    setMemos(updatedMemos);
    setIsEditing(false);
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(memos.filter(m => m.id !== id));
    if (selectedMemo?.id === id) {
      setSelectedMemo(null);
      setIsEditing(false);
      setIsViewing(false);
    }
  };

  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsEditing(false);
    setIsViewing(true);
  };

  const handleEditMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsEditing(true);
    setIsViewing(false);
  };

  const handleOrganizeMemo = async (memo: Memo) => {
    // Mock AI organization - in real implementation, this would call Gemini API
    const organizedContent = mockOrganizeContent(memo.content);
    const organizedMemo: Memo = {
      ...memo,
      content: organizedContent,
      isOrganized: true,
      updatedAt: new Date()
    };
    
    const updatedMemos = memos.map(m => m.id === memo.id ? organizedMemo : m);
    setMemos(updatedMemos);
    setSelectedMemo(organizedMemo);
  };

  const mockOrganizeContent = (content: string): string => {
    // This is a mock function - real implementation would use Gemini API
    if (!content.trim()) return content;
    
    return `# 정리된 메모

## 📝 주요 내용
${content.split('\n').filter(line => line.trim()).map(line => `- ${line.trim()}`).join('\n')}

## 💡 핵심 아이디어
- AI가 분석한 주요 키워드들을 바탕으로 정리됨
- 내용이 주제별로 응집되어 가독성이 향상됨

## 🔍 추가 고려사항
- 향후 더 자세한 분석이 필요한 부분들
- 관련 참고자료나 추가 학습 포인트

---
*이 메모는 AI에 의해 자동으로 정리되었습니다.*`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header onCreateMemo={handleCreateMemo} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Memo List */}
          <div className="lg:col-span-1">
            <MemoList
              memos={memos}
              selectedMemo={selectedMemo}
              onSelectMemo={handleSelectMemo}
              onEditMemo={handleEditMemo}
              onDeleteMemo={handleDeleteMemo}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {isEditing && selectedMemo ? (
              <MemoEditor
                memo={selectedMemo}
                onSave={handleSaveMemo}
                onCancel={() => setIsEditing(false)}
              />
            ) : isViewing && selectedMemo ? (
              <MemoViewer
                memo={selectedMemo}
                onEdit={() => handleEditMemo(selectedMemo)}
                onOrganize={() => handleOrganizeMemo(selectedMemo)}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">📝</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    메모를 선택하거나 새로 만들어보세요
                  </h2>
                  <p className="text-gray-600 mb-8">
                    AI가 여러분의 자유로운 메모를 관심사별로 정리해드립니다
                  </p>
                  <button
                    onClick={handleCreateMemo}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    새 메모 작성하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
