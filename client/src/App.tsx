import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import MonthView from './components/MonthView';
import DetailPage from './components/DetailPage'; // 나중에 만들 파일

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Loading...</div>;

  if (!user) return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif'}}>
      <h1>Being and Time</h1>
      <button onClick={() => signInWithPopup(auth, googleProvider)}>Continue with Google</button>
    </div>
  );

  return selectedDate ? (
    <div style={{padding: '20px'}}>
      <button onClick={() => setSelectedDate(null)}>← 달력으로</button>
      <h2>{selectedDate} 기록하기</h2>
      <textarea style={{width: '100%', height: '300px', marginTop: '20px'}} placeholder="여기에 내용을 적으세요 (자동 저장 기능 준비 중...)" />
    </div>
  ) : (
    <MonthView user={user} onSelectDate={setSelectedDate} />
  );
}