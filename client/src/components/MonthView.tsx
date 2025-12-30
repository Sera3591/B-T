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
    const element = document.getElementById('full-report'); // 전체 영역 선택
    const options = {
      margin: 10,
      filename: `${format(currentMonth, 'yyyy년 MM월')} 기록장.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // 페이지 끊김 방지
    };
    html2pdf().set(options).from(element).save();
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  // 🗓️ 해당 월에 작성된 일기만 날짜순으로 정렬
  const sortedEntryKeys = Object.keys(entries)
    .filter(key => key.startsWith(format(currentMonth, 'yyyy-MM')))
    .sort();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '15px' }}>
        <button onClick={downloadPDF} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 15px', cursor: 'pointer', fontSize: '0.85rem' }}>PDF 통합 저장</button>
        <button onClick={() => { if(window.confirm('로그아웃?')) signOut(auth); }} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>로그아웃</button>
      </div>

      {/* 📥 PDF로 저장될 전체 영역 */}
      <div id="full-report" style={{ backgroundColor: '#fff' }}>

        {/* [1페이지] 달력 부분 */}
        <div style={{ padding: '20px', pageBreakAfter: 'always' }}>
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2rem' }}>{format(currentMonth, 'yyyy년 MM월')}</h1>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #eee' }}>
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f9f9f9', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>{d}</div>
            ))}
            {days.map(day => (
              <div key={day.toString()} style={{ height: '100px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', padding: '5px' }}>
                <div style={{ fontSize: '0.9rem', color: isSameMonth(day, currentMonth) ? '#333' : '#ccc' }}>{format(day, 'd')}</div>
                {entries[format(day, 'yyyy-MM-dd')] && <div style={{ fontSize: '0.6rem', color: '#2196f3' }}>● 기록 있음</div>}
              </div>
            ))}
          </div>
        </div>

        {/* [2페이지부터] 상세 내용 (날짜순) */}
        <div style={{ padding: '20px' }}>
          <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '30px' }}>상세 일기 기록</h2>
          {sortedEntryKeys.length > 0 ? (
            sortedEntryKeys.map(dateKey => (
              <div key={dateKey} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
                <h3 style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>{dateKey}</h3>
                <div 
                  style={{ padding: '10px 20px', lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: entries[dateKey].content }} 
                />
              </div>
            ))
          ) : (
            <p style={{ color: '#999' }}>이 달에 작성된 일기가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}