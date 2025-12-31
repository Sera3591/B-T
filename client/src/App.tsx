import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// 📁 파일들이 components/ui/ 폴더 안에 있으므로 경로를 모두 수정했습니다.
import CalendarView from './components/ui/calendar';
import SearchBar from './components/ui/SearchBar';
import DetailPage from './components/DetailPage';
import Auth from './components/Auth';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlight, setHighlight] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // ✨ 검색 결과 클릭 시 세부 페이지로 이동하는 함수
  const handleSelectResult = (date: string, searchKeyword: string) => {
    setHighlight(searchKeyword);
    setSelectedDate(date);
  };

  if (!user) return <Auth />;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SearchBar user={user} onSelectResult={handleSelectResult} />
        <button 
          onClick={() => signOut(auth)} 
          style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>

      {selectedDate ? (
        <DetailPage 
          user={user} 
          date={selectedDate} 
          highlight={highlight} 
          onBack={() => {
            setSelectedDate(null);
            setHighlight('');
          }} 
        />
      ) : (
        <CalendarView 
          user={user} 
          onSelectDate={(date: string) => {
            setHighlight('');
            setSelectedDate(date);
          }} 
        />
      )}
    </div>
  );
}