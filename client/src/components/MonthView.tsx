import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth, parseISO } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

  const goToDate = (dateStr: string) => {
    const targetDate = parseISO(dateStr);
    setCurrentMonth(targetDate);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}> {/* 전체 폭을 1000px로 확대 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}> {/* 간격을 60px로 대폭 확대 */}
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>←</button>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee', fontSize: '1.1rem', fontWeight: '500', backgroundColor: '#fff', cursor: 'pointer' }}>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={currentMonth.getMonth()} onChange={(e) => setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee', fontSize: '1.1rem', fontWeight: '500', backgroundColor: '#fff', cursor: 'pointer' }}>
            {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
          </select>
        </div>

        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>→</button>
      </header>

      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#eee9e0', padding: '30px', borderRadius: '15px', marginBottom: '50px', color: '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '700', letterSpacing: '-0.02em' }}>과거에서 온 편지</h4>
          {futureMemos.map((m) => (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', padding: '15px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1.6', flex: 1 }}>{m.text}</span>
                <button onClick={() => deleteMemo(m.id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '20px' }}>삭제</button>
              </div>
              <div onClick={() => goToDate(m.fromDate)} style={{ fontSize: '0.85rem', color: '#888', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
                {m.fromDate}에 작성함
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📅 달력 크기 확대 및 디자인 조정 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '20px 0', fontWeight: '600', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', color: d === '일' ? '#ef5350' : '#555', fontSize: '0.9rem' }}>{d}</div>
        ))}
        {days.map(day => (
          <div key={day.toString()} onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} style={{ 
            height: '140px', // 날짜 칸 높이 확대 (기존보다 훨씬 크게)
            borderBottom: '1px solid #f0f0f0', 
            borderRight: '1px solid #f0f0f0', 
            padding: '15px', 
            cursor: 'pointer', 
            backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ 
              fontSize: '1rem', 
              color: isSameDay(day, new Date()) ? '#2196f3' : (format(day, 'E') === 'Sun' ? '#ef5350' : '#666'), 
              fontWeight: isSameDay(day, new Date()) ? '800' : '500' 
            }}>{format(day, 'd')}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '12px', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 30)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}