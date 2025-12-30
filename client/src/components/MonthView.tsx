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
    const element = document.getElementById('full-report');
    const options = {
      margin: 10,
      filename: `${format(currentMonth, 'yyyy년 MM월')} 기록장.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(options).from(element).save();
  };

  const deleteMemo = async (memoId: string) => {
    if (window.confirm('이 메모를 삭제할까요?')) {
      await deleteDoc(doc(db, `users/${user.uid}/future_memos`, memoId));
      fetchData();
    }
  };

  const goToDate = (dateStr: string) => setCurrentMonth(parseISO(dateStr));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const sortedEntryKeys = Object.keys(entries)
    .filter(key => key.startsWith(format(currentMonth, 'yyyy-MM')))
    .sort();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      {/* 상단 버튼 영역 (여기는 PDF에 안 나옴) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '15px' }}>
        <button onClick={downloadPDF} style={{ background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px 15px', cursor: 'pointer', fontSize: '0.85rem' }}>PDF 통합 저장</button>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>로그아웃</button>
      </div>

      <div id="full-report">
        {/* 달력 헤더 */}
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

        {/* 과거 메모 영역 */}
        {futureMemos.length > 0 && (
          <div style={{ backgroundColor: '#eee9e0', padding: '30px', borderRadius: '15px', marginBottom: '50px' }}>
            <h4 style={{ margin: '0 0 20px 0' }}>과거에서 온 편지</h4>
            {futureMemos.map((m) => (
              <div key={m.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span onClick={() => goToDate(m.fromDate)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{m.text} ({m.fromDate} 작성)</span>
                <button onClick={() => deleteMemo(m.id)} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}>삭제</button>
              </div>
            ))}
          </div>
        )}

        {/* 달력 본문 (onClick 다시 추가됨!) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '20px 0', fontWeight: '600', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>{d}</div>
          ))}
          {days.map(day => (
            <div 
              key={day.toString()} 
              onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} // 👈 이 기능이 돌아왔습니다!
              style={{ 
                height: '140px', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', padding: '15px', cursor: 'pointer',
                backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9'
              }}
            >
              <div style={{ fontWeight: '800', color: isSameDay(day, new Date()) ? '#2196f3' : '#666' }}>{format(day, 'd')}</div>
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '12px', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 30)}
              </div>
            </div>
          ))}
        </div>

        {/* PDF 상세 페이지 영역 (화면에서는 구분선으로만 보임) */}
        <div className="pdf-only" style={{ marginTop: '80px', paddingTop: '40px', borderTop: '2px solid #333' }}>
          <h2 style={{ marginBottom: '30px' }}>상세 일기 기록</h2>
          {sortedEntryKeys.map(dateKey => (
            <div key={dateKey} style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
              <h3 style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>{dateKey}</h3>
              <div dangerouslySetInnerHTML={{ __html: entries[dateKey].content }} style={{ padding: '10px 20px', lineHeight: '1.8' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}