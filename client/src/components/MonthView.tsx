import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

  // 연도 선택 범위 (현재 연도 기준 전후 5년)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const fetchData = async () => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    const qEntries = query(collection(db, `users/${user.uid}/entries`));
    const snapEntries = await getDocs(qEntries);
    const data: any = {};
    snapEntries.forEach(doc => { data[doc.id] = doc.data(); });
    setEntries(data);

    const qMemos = query(collection(db, `users/${user.uid}/future_memos`), where("targetMonth", "==", monthStr));
    const snapMemos = await getDocs(qMemos);
    setFutureMemos(snapMemos.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, [currentMonth, user.uid]);

  const deleteMemo = async (memoId: string) => {
    if (window.confirm('이 메모를 삭제할까요?')) {
      await deleteDoc(doc(db, `users/${user.uid}/future_memos`, memoId));
      fetchData();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)));
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>

        {/* 💡 연도와 월을 선택할 수 있는 드롭박스 영역 */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={currentMonth.getFullYear()} 
            onChange={handleYearChange}
            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1rem', cursor: 'pointer' }}
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select 
            value={currentMonth.getMonth()} 
            onChange={handleMonthChange}
            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1rem', cursor: 'pointer' }}
          >
            {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
          </select>
        </div>

        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>→</button>
      </header>

      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#fffef0', padding: '15px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #fbc02d', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#f9a825' }}>✨ 과거에서 온 편지</h4>
          {futureMemos.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px dashed #eee' }}>
              <span style={{ fontSize: '0.95rem' }}>• {m.text}</span>
              <button onClick={() => deleteMemo(m.id)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.75rem' }}>삭제</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ textAlign: 'center', padding: '15px', fontWeight: 'bold', backgroundColor: '#fafafa', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>{d}</div>)}
        {days.map(day => (
          <div 
            key={day.toString()} 
            onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))}
            style={{ 
              height: '110px', borderBottom: '1px solid #eee', borderRight: '1px solid #eee', padding: '10px',
              cursor: 'pointer', backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#fcfcfc',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ fontSize: '0.9rem', color: isSameDay(day, new Date()) ? '#2196f3' : '#666', fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal' }}>{format(day, 'd')}</div>
            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '8px', overflow: 'hidden', height: '50px' }}>
              {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 25)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}