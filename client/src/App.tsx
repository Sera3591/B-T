import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import MonthView from './components/MonthView';
import DetailPage from './components/DetailPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 관리
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("로그인에 실패했습니다.");
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>;

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#eee9e0' }}>
        <h1 style={{ marginBottom: '20px' }}>존재와 시간</h1>
        <button onClick={handleLogin} style={{ padding: '15px 40px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          구글로 시작하기
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fcfaf7', minHeight: '100vh' }}>
      {selectedDate ? (
        <DetailPage 
          uid={user.uid} 
          date={selectedDate} 
          searchTerm={searchTerm} // 상세 페이지로 검색어 전달
          onBack={() => setSelectedDate(null)} 
        />
      ) : (
        <MonthView 
          user={user} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} // 검색어 상태 동기화
          onSelectDate={(date: string) => setSelectedDate(date)} 
        />
      )}
    </div>
  );
}