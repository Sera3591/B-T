import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import MonthView from './components/MonthView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 로그인 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 로그인 함수
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("로그인 에러 상세:", error);
      alert("로그인에 실패했습니다. Firebase 콘솔에서 Google 로그인이 '사용 설정' 되어 있는지 확인해주세요.");
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>잠시만 기다려주세요...</p>
    </div>
  );

  // 로그인 전 화면
  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Century Gothic, sans-serif', backgroundColor: '#fdfdfd' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '10px' }}>Being and Time</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>당신의 시간을 기록하는 고요한 공간</p>
      <button 
        onClick={handleLogin}
        style={{
          padding: '12px 24px',
          fontSize: '1rem',
          cursor: 'pointer',
          borderRadius: '30px',
          border: '1px solid #ddd',
          backgroundColor: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
      >
        Google 계정으로 시작하기
      </button>
    </div>
  );

  // 로그인 후 화면 (날짜 선택 여부에 따라 달력 혹은 상세페이지)
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {selectedDate ? (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <button 
            onClick={() => setSelectedDate(null)}
            style={{ marginBottom: '20px', cursor: 'pointer', border: 'none', background: 'none', color: '#666' }}
          >
            ← 달력으로 돌아가기
          </button>
          <h2 style={{ marginBottom: '20px' }}>{selectedDate}의 기록</h2>
          <textarea 
            style={{ 
              width: '100%', 
              height: '400px', 
              padding: '20px', 
              borderRadius: '10px', 
              border: '1px solid #eee', 
              fontSize: '1.1rem',
              lineHeight: '1.6',
              outline: 'none'
            }} 
            placeholder="오늘의 생각이나 감정을 자유롭게 적어보세요..."
          />
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '10px' }}>* 내용은 현재 기기에만 임시 표시됩니다. (저장 기능 곧 추가 예정)</p>
        </div>
      ) : (
        <MonthView user={user} onSelectDate={setSelectedDate} />
      )}
    </div>
  );
}