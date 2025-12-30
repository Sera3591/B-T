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

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) signOut(auth);
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

  const sortedEntryKeys = Object.keys(entries)
    .filter(key => key.startsWith(format(currentMonth, 'yyyy-MM')))
    .sort();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      {/* 🛠️ 상단 메뉴 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '15px' }}>
        <button onClick={downloadPDF} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 15px', cursor: 'pointer', fontSize: '0.85rem' }}>PDF 통합 저장</button>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>로그아웃</button>
      </div>

      {/* 📅 화면에 보이는 달력 영역 (클릭 기능 보장) */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>←</button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee' }}>
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select value={currentMonth.getMonth()} onChange={(e) => setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)))} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #eee' }}>
            {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
          </select>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>→</button>
      </header>

      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#eee9e0', padding: '30px', borderRadius: '15px', marginBottom: '50px' }}>
          <h4 style={{ margin: '0 0 20px 0' }}>과거에서 온 편지</h4>
          {futureMemos.map((m) => (
            <div key={m.id} style={{ marginBottom: '10px' }}>• {m.text} ({m.fromDate} 작성)</div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '20px 0', fontWeight: '600', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>{d}</div>
        ))}
        {days.map(day => (
          <div 
            key={day.toString()} 
            onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} 
            style={{ height: '140px', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', padding: '15px', cursor: 'pointer', backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9' }}
          >
            <div style={{ fontWeight: '800', color: isSameDay(day, new Date()) ? '#2196f3' : '#666' }}>{format(day, 'd')}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '12px' }}>
              {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 30)}
            </div>
          </div>
        ))}
      </div>

      {/* 📑 PDF용 숨겨진 영역 (이 영역이 PDF 파일로 만들어짐) */}
      <div id="pdf-root" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '50px' }}>{format(currentMonth, 'yyyy년 MM월')} 일기 기록장</h1>
        {sortedEntryKeys.map(dateKey => (
          <div key={dateKey} style={{ marginBottom: '50px', pageBreakInside: 'avoid' }}>
            <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>{dateKey}</h2>
            <div dangerouslySetInnerHTML={{ __html: entries[dateKey].content }} style={{ lineHeight: '1.8', paddingTop: '10px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}