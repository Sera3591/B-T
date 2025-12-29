import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const monthStr = format(currentMonth, 'yyyy-MM');

      // 1. 해당 월의 일기 데이터 가져오기
      const qEntries = query(collection(db, `users/${user.uid}/entries`));
      const snapEntries = await getDocs(qEntries);
      const data: any = {};
      snapEntries.forEach(doc => { data[doc.id] = doc.data(); });
      setEntries(data);

      // 2. 해당 월에 도착한 미래 메모 가져오기
      const qMemos = query(
        collection(db, `users/${user.uid}/future_memos`),
        where("targetMonth", "==", monthStr)
      );
      const snapMemos = await getDocs(qMemos);
      setFutureMemos(snapMemos.docs.map(doc => doc.data()));
    };
    fetchData();
  }, [currentMonth, user.uid]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>이전 달</button>
        <h2 style={{ margin: 0 }}>{format(currentMonth, 'yyyy년 MM월')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>다음 달</button>
      </header>

      {/* 미래 메모 알림창 */}
      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#fffef0', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fbc02d' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#f9a825' }}>✨ 과거에서 도착한 메모</h4>
          {futureMemos.map((m, i) => (
            <div key={i} style={{ fontSize: '1rem', paddingBottom: '5px' }}>• {m.text}</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #eee' }}>
        {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ textAlign: 'center', padding: '10px', fontWeight: 'bold' }}>{d}</div>)}
        {days.map(day => (
          <div 
            key={day.toString()} 
            onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))}
            style={{ 
              height: '100px', borderBottom: '1px solid #eee', borderRight: '1px solid #eee', padding: '5px',
              cursor: 'pointer', backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9',
              color: isSameDay(day, new Date()) ? 'blue' : 'inherit'
            }}
          >
            <div style={{ fontSize: '0.8rem' }}>{format(day, 'd')}</div>
            <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '5px' }}>
              {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 15)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
