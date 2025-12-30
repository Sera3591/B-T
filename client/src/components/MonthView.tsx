import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth, parseISO } from 'date-fns';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
// @ts-ignore
import html2pdf from 'html2pdf.js'; // PDF 변환 라이브러리

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

  // 📥 PDF 다운로드 함수
  const downloadPDF = () => {
    const element = document.getElementById('calendar-content');
    const options = {
      margin: 10,
      filename: `${format(currentMonth, 'yyyy년 MM월')} 일기장.pdf`,
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

  const goToDate = (dateStr: string) => {
    setCurrentMonth(parseISO(dateStr));
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '15px' }}>
        {/* 📥 PDF 버튼 추가 */}
        <button onClick={downloadPDF} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
          PDF 저장
        </button>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
          로그아웃
        </button>
      </div>

      {/* PDF로 쪄낼 영역 시작 */}
      <div id="calendar-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>←</button>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
            {format(currentMonth, 'yyyy년 MM월')}
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>→</button>
        </header>

        {futureMemos.length > 0 && (
          <div style={{ backgroundColor: '#eee9e0', padding: '30px', borderRadius: '15px', marginBottom: '50px' }}>
            <h4 style={{ margin: '0 0 20px 0' }}>과거에서 온 편지</h4>
            {futureMemos.map((m) => (
              <div key={m.id} style={{ marginBottom: '10px' }}>
                • {m.text} ({m.fromDate} 작성)
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '15px 0', fontWeight: '600', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>{d}</div>
          ))}
          {days.map(day => (
            <div key={day.toString()} onClick={() => onSelectDate(format(day, 'yyyy-MM-dd'))} style={{ height: '140px', borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', padding: '10px', backgroundColor: isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9' }}>
              <div style={{ fontWeight: 'bold', color: isSameDay(day, new Date()) ? '#2196f3' : '#666' }}>{format(day, 'd')}</div>
              <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>
                {entries[format(day, 'yyyy-MM-dd')]?.content?.replace(/<[^>]*>/g, '').substring(0, 20)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}