import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 반드시 'export default'가 붙어 있어야 합니다!
export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={currentMonth.getFullYear()} onChange={handleYearChange} style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1rem', cursor: 'pointer' }}>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={currentMonth.getMonth()} onChange={handleMonthChange} style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '1rem', cursor: 'pointer' }}>
            {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
          </select>
        </div>

        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>→</button>
      </header>

      {/* 💡 요청하신 대로 스트로크 없이 깔끔한 베이지색 미래 메모 영역 */}
      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#eee9e0', padding: '25px', borderRadius: '12px', marginBottom: '30px', color: '#333' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '-0.02em' }}>과거에서 온 편지</h4>
          {futureMemos.map((m) => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>{m.text}</span>
              <button onClick={() => deleteMemo(m.id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '15px' }}>삭제</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ textAlign: 'center', padding: '15px', fontWeight: 'bold', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>{d}</div>)}
        {days.map(day => (
          <div key={day.toString()} onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} style={{ height: '110px', borderBottom: '1px solid #eee', borderRight: '1px solid #eee', padding: '10px', cursor: 'pointer', backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#fcfcfc' }}>
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