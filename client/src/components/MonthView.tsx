import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth, parseISO } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const fetchData = async () => {
    const qEntries = query(collection(db, `users/${user.uid}/entries`));
    const snapEntries = await getDocs(qEntries);
    const data: any = {};
    snapEntries.forEach(doc => { data[doc.id] = doc.data(); });
    setEntries(data);

    const monthStr = format(currentMonth, 'yyyy-MM');
    const qMemos = query(collection(db, `users/${user.uid}/future_memos`), where("targetMonth", "==", monthStr));
    const snapMemos = await getDocs(qMemos);
    setFutureMemos(snapMemos.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchData(); }, [currentMonth, user.uid]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
          <mark key={i} style={{ backgroundColor: '#ffeb3b' }}>{part}</mark> : part
        )}
      </span>
    );
  };

  const downloadPDF = () => {
    const element = document.getElementById('pdf-root');
    const options = {
      margin: 10,
      filename: `${format(currentMonth, 'yyyy년 MM월')} 일기장.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(options).from(element).save();
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const searchResults = Object.keys(entries)
    .filter(date => entries[date].content.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.localeCompare(a));

  const sortedEntryKeys = Object.keys(entries)
    .filter(key => key.startsWith(format(currentMonth, 'yyyy-MM')))
    .sort();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="내용 검색..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '20px', border: '1px solid #ddd', width: '250px' }}
        />
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={downloadPDF} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 15px', cursor: 'pointer' }}>PDF 통합 저장</button>
          <button onClick={() => { if(window.confirm('로그아웃?')) signOut(auth); }} style={{ color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>로그아웃</button>
        </div>
      </div>

      {searchTerm && (
        <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '15px', marginBottom: '40px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>🔍 검색 결과</h4>
          {searchResults.map(date => (
            <div key={date} onClick={() => onSelectDate(date, searchTerm)} style={{ padding: '10px', backgroundColor: '#fff', marginBottom: '5px', borderRadius: '8px', cursor: 'pointer' }}>
              <div style={{ fontWeight: 'bold', color: '#2196f3' }}>{date}</div>
              <div style={{ fontSize: '0.85rem' }}>{highlightText(entries[date].content.replace(/<[^>]*>/g, ''), searchTerm)}</div>
            </div>
          ))}
          <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem' }}>닫기</button>
        </div>
      )}

      {/* 달력 헤더 및 본문은 이전과 동일하므로 생략하지 않고 유지합니다 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem' }}>←</button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee' }}>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={currentMonth.getMonth()} onChange={(e) => setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee' }}>
            {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
          </select>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem' }}>→</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #f0f0f0' }}>
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '20px 0', fontWeight: '600', backgroundColor: '#fafafa' }}>{d}</div>
        ))}
        {days.map(day => (
          <div key={day.toString()} onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} style={{ height: '140px', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', padding: '15px', cursor: 'pointer' }}>
            <div style={{ fontWeight: '800', color: isSameDay(day, new Date()) ? '#2196f3' : '#666' }}>{format(day, 'd')}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '12px' }}>{entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 30)}</div>
          </div>
        ))}
      </div>

      <div id="pdf-root" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center' }}>{format(currentMonth, 'yyyy년 MM월')} 일기장</h1>
        {sortedEntryKeys.map(dateKey => (
          <div key={dateKey} style={{ marginBottom: '30px' }}>
            <h2>{dateKey}</h2>
            <div dangerouslySetInnerHTML={{ __html: entries[dateKey].content }} />
          </div>
        ))}
      </div>
    </div>
  );
}