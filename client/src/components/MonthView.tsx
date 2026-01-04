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
    const monthStr = format(currentMonth, 'yyyy-MM');
    // 보안과 성능을 위해 유저의 전체 데이터를 가져옵니다.
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

  // 🔍 전체 데이터에서 검색된 결과 모으기 (연도/월 상관없이)
  const allSearchResults = Object.keys(entries)
    .filter(dateKey => entries[dateKey].content?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.localeCompare(a)) // 최신순 정렬
    .map(dateKey => ({
      dateKey,
      content: entries[dateKey].content.replace(/<[^>]*>/g, '') // 태그 제거
    }));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            placeholder="모든 일기 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 15px', borderRadius: '25px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={downloadPDF} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>PDF 저장</button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>로그아웃</button>
        </div>
      </div>

      {/* 📂 검색 결과 요약 리스트 (검색어가 있을 때만 표시) */}
      {searchTerm && (
        <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #d1d9e6' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>'{searchTerm}' 검색 결과 ({allSearchResults.length}건)</h4>
          {allSearchResults.length > 0 ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allSearchResults.map(result => (
                <div 
                  key={result.dateKey}
                  onClick={() => { goToDate(result.dateKey); onSelectDate(result.dateKey); }}
                  style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', border: '1px solid #e1e8ed', transition: 'all 0.2s' }}
                >
                  <strong style={{ color: '#2196f3' }}>{result.dateKey}</strong>
                  <span style={{ marginLeft: '10px', color: '#555' }}>{result.content.substring(0, 50)}...</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: '0.9rem' }}>일치하는 일기가 없습니다.</div>
          )}
        </div>
      )}

      <div id="calendar-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>←</button>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
            {format(currentMonth, 'yyyy년 MM월')}
          </div>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#333' }}>→</button>
        </header>

        {futureMemos.length > 0 && (
          <div style={{ backgroundColor: '#eee9e0', padding: '30px', borderRadius: '15px', marginBottom: '50px', color: '#333' }}>
            <h4 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: '700' }}>과거에서 온 편지</h4>
            {futureMemos.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span>• {m.text} ({m.fromDate} 작성)</span>
                <button onClick={(e) => { e.stopPropagation(); deleteMemo(m.id); }} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>삭제</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', border: '1px solid #f0f0f0', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '15px 0', fontWeight: '600', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', color: d === '일' ? '#ef5350' : (d === '토' ? '#2196f3' : '#555') }}>{d}</div>
          ))}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const content = entries[dateKey]?.content || '';
            const isMatch = searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div 
                key={dateKey} 
                onClick={() => onSelectDate(dateKey)} 
                style={{ 
                  height: '140px', 
                  borderBottom: '1px solid #f0f0f0', 
                  borderRight: '1px solid #f0f0f0', 
                  padding: '10px', 
                  backgroundColor: isMatch ? '#fff9c4' : (isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9'), 
                  cursor: 'pointer' 
                }}
              >
                <div style={{ fontWeight: 'bold', color: isSameDay(day, new Date()) ? '#2196f3' : (format(day, 'E') === 'Sun' ? '#ef5350' : '#666') }}>{format(day, 'd')}</div>
                <div style={{ fontSize: '0.7rem', color: isMatch ? '#000' : '#888', marginTop: '5px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {content.replace(/<[^>]*>/g, '').substring(0, 30)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}