import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setYear, setMonth, parseISO } from 'date-fns';
import { collection, query, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';

export default function MonthView({ user, onSelectDate, searchTerm, setSearchTerm }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<any>({});
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) return;
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

  // 미래 메시지 개별 삭제 함수
  const handleDeleteMemo = async (memoId: string) => {
    if (!window.confirm("이 메시지를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/future_memos`, memoId));
      fetchData(); // 삭제 후 목록 새로고침
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const filteredResults = Object.keys(entries)
    .filter(date => searchTerm && entries[date].content.replace(/<[^>]*>/g, '').toLowerCase().includes(searchTerm.toLowerCase()))
    .map(date => ({ date, content: entries[date].content.replace(/<[^>]*>/g, '') }));

  const monthKey = format(currentMonth, 'yyyy-MM');
  const sortedMonthEntries = Object.keys(entries)
    .filter(key => key.startsWith(monthKey))
    .sort();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 상단 도구 */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <input 
            type="text" 
            placeholder="모든 일기 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '12px 40px 12px 20px', borderRadius: '25px', border: '1px solid #ddd', width: '100%', outline: 'none' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#aaa' }}>×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={() => window.print()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>PDF 저장</button>
          <button onClick={() => window.confirm('로그아웃 하시겠습니까?') && signOut(auth)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>로그아웃</button>
        </div>
      </div>

      {/* 검색 결과 */}
      {searchTerm && filteredResults.length > 0 && (
        <div className="no-print" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>검색 결과 ({filteredResults.length}건)</h4>
          {filteredResults.map(res => (
            <div key={res.date} onClick={() => onSelectDate(res.date)} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
              <strong>{res.date}</strong>: {res.content.substring(0, 50)}...
            </div>
          ))}
        </div>
      )}

      {/* 달력 섹션 */}
      <div className="print-page">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="no-print" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>←</button>
          <h2 style={{ margin: 0 }}>{format(currentMonth, 'yyyy년 MM월')}</h2>
          <button className="no-print" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>→</button>
        </header>

        {/* 미래 메시지 UI 개선 (두 번째 사진 스타일) */}
        {futureMemos.length > 0 && (
          <div style={{ marginBottom: '25px', padding: '18px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#495057', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💌 과거에서 도착한 편지
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {futureMemos.map(memo => (
                <div key={memo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <span style={{ fontSize: '0.9rem', color: '#333' }}>{memo.text}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteMemo(memo.id); }} 
                    style={{ border: 'none', background: 'none', color: '#ced4da', cursor: 'pointer', fontSize: '1.1rem', padding: '0 5px', lineHeight: '1' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '15px 0', fontWeight: 'bold', backgroundColor: '#fafafa', color: d === '일' ? '#ef5350' : '#555', border: '0.5px solid #f0f0f0' }}>{d}</div>
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entries[dateStr];
            const isMatch = searchTerm && entry?.content?.replace(/<[^>]*>/g, '').toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div key={dateStr} onClick={() => onSelectDate(dateStr)} style={{ height: '120px', border: '0.5px solid #f0f0f0', padding: '10px', cursor: 'pointer', backgroundColor: isMatch ? '#fff9c4' : (isSameMonth(day, currentMonth) ? '#fff' : '#f9f9f9') }}>
                <div style={{ color: isSameDay(day, new Date()) ? '#2196f3' : (format(day, 'E') === 'Sun' ? '#ef5350' : '#666'), fontWeight: 'bold' }}>{format(day, 'd')}</div>
                <div style={{ fontSize: '0.7rem', color: '#333', marginTop: '5px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {entry?.content?.replace(/<[^>]*>/g, '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="print-only">
        {sortedMonthEntries.map(dKey => (
          <div key={dKey} style={{ pageBreakBefore: 'always', padding: '40px 0' }}>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '30px' }}>{dKey}</h2>
            <div dangerouslySetInnerHTML={{ __html: entries[dKey].content }} style={{ lineHeight: '2.2', fontSize: '1.1rem' }} />
          </div>
        ))}
      </div>

      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-page { page-break-after: always; }
          body { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}