import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import MonthView from './components/MonthView';
import DetailPage from './components/DetailPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Century Gothic, sans-serif' }}>
      <h1>Being and Time</h1>
      <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '20px', border: '1px solid #ddd' }}>
        Google 계정으로 시작하기
      </button>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {selectedDate ? (
        /* 이제 임시 텍스트 상자가 아니라 진짜 DetailPage를 보여줍니다 */
        <DetailPage 
          uid={user.uid} 
          date={selectedDate} 
          onBack={() => setSelectedDate(null)} 
        />
      ) : (
        <MonthView user={user} onSelectDate={setSelectedDate} />
      )}
    </div>
  );
}
