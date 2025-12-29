import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});

  // 해당 월의 데이터 불러오기
  useEffect(() => {
    const fetchEntries = async () => {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const q = query(collection(db, `users/${user.uid}/entries`), 
                where("__name__", ">=", `${monthStr}-01`),
                where("__name__", "<=", `${monthStr}-31`));
      const snap = await getDocs(q);
      const data: any = {};
      snap.forEach(doc => { data[doc.id] = doc.data(); });
      setEntries(data);
    };
    fetchEntries();
  }, [currentMonth, user.uid]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>이전 달</button>
        <h2>{format(currentMonth, 'yyyy년 MM월')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>다음 달</button>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderLeft: '1px solid #eee' }}>
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
            <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '5px', overflow: 'hidden' }}>
              {entries[format(day, 'yyyy-MM-dd')]?.content?.substring(0, 20)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}