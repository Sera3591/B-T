import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth, parseISO } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function MonthView({ user, onSelectDate, searchTerm, setSearchTerm }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

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

  const downloadPDF = () => {
    const element = document.getElementById('calendar-content');
    const options = {
      margin: 10, filename: `${format(currentMonth, 'yyyy-MM')} 일기장.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
  };

  const deleteMemo = async (memoId: string) => {
    if (window.confirm('이 메모를 삭제할까요?')) {
      await deleteDoc(doc(db, `users/${user.uid}/future_memos`, memoId));
      fetchData();
    }
  };

  const allSearchResults = Object.keys(entries)
    .filter(dateKey => searchTerm && entries[dateKey].content?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.localeCompare(a))
    .map(dateKey => ({ dateKey, content: entries[dateKey].content.replace(/<[^>]*>/g, '') }));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input type="text" placeholder="모든 일기 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 15px', borderRadius: '25px', border: '1px solid #ddd' }} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>}
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={downloadPDF} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', textDecoration: 'underline' }}>PDF 저장</button>
          <button onClick={() => signOut(auth)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', textDecoration: 'underline' }}>로그아웃</button>
        </div>
      </div>

      {searchTerm && (
        <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
          <h4>'{searchTerm}' 검색 결과 ({allSearchResults.length}건)</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {allSearchResults.map(result => (
              <div key={result.dateKey} onClick={() => { setCurrentMonth(parseISO(result.dateKey)); onSelectDate(result.dateKey); }} style={{ backgroundColor: '#fff', padding: '10px', marginBottom: '5px', borderRadius: '5px', cursor: 'pointer' }}>
                <strong style={{ color: '#2196f3' }}>{result.dateKey}</strong> {result.content.substring(0, 40)}...
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="calendar-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{format(currentMonth, 'yyyy년 MM월')}</div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>→</button>
        </header>

        {futureMemos.length > 0 && (
          <div style={{ backgroundColor: '#eee9e0', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>과거에서 온 편지</h4>
            {futureMemos.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>• {m.text} ({m.fromDate} 작성)</span>
                <button onClick={() => deleteMemo(m.id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}>삭제</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #f0f0f0', borderRadius: '15px', overflow: 'hidden' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '10px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>{d}</div>
          ))}
          {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth)), end: endOfWeek(endOfMonth(currentMonth)) }).map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const content = entries[dateKey]?.content || '';
            const isMatch = searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div key={dateKey} onClick={() => onSelectDate(dateKey)} style={{ height: '120px', padding: '10px', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', backgroundColor: isMatch ? '#fff9c4' : (isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9'), cursor: 'pointer' }}>
                <div style={{ fontWeight: 'bold', color: isSameDay(day, new Date()) ? '#2196f3' : '#666' }}>{format(day, 'd')}</div>
                <div style={{ fontSize: '0.7rem', color: isMatch ? '#000' : '#888' }}>{content.replace(/<[^>]*>/g, '').substring(0, 25)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}