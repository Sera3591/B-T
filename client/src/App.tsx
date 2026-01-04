import React, { useState, useEffect } from 'react';
import MonthView from './components/MonthView';
import DetailPage from './components/DetailPage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>로딩 중...</div>;
  if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>구글 로그인이 필요합니다.</div>;

  return (
    <div>
      {selectedDate ? (
        <DetailPage 
          uid={user.uid} 
          date={selectedDate} 
          onBack={() => setSelectedDate(null)} 
          highlightTerm={searchTerm} 
        />
      ) : (
        <MonthView 
          user={user} 
          onSelectDate={(date: string) => setSelectedDate(date)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm} 
        />
      )}
    </div>
  );
}