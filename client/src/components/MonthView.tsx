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

    // 1. 일기 데이터 로드 (기존 로직 유지)
    const qEntries = query(collection(db, `users/${user.uid}/entries`));
    const snapEntries = await getDocs(qEntries);
    const data: any = {};
    snapEntries.forEach(doc => { data[doc.id] = doc.data(); });
    setEntries(data);

    // 2. 미래 메시지 로드 (색인 에러 방지 및 형식 보완 로직)
    const monthStr = format(currentMonth, 'yyyy-MM');
    const qMemos = collection(db, `users/${user.uid}/future_memos`);
    const snapMemos = await getDocs(qMemos);

    const filteredMemos = snapMemos.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((m: any) => {
        const dbMonth = m.targetMonth;
        // "2026-02"와 "2026-2" 형식을 모두 찾아내어 Eric의 프로젝트에서도 잘 나오게 합니다.
        return dbMonth === monthStr || dbMonth === monthStr.replace("-0", "-");
      });

    setFutureMemos(filteredMemos);
  };

  useEffect(() => { fetchData(); }, [currentMonth, user.uid]);

  // 미래 메시지 개별 삭제 함수
  const handleDeleteMemo = async (memoId: string) => {
    if (!window.confirm("이 메시지를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/future_memos`, memoId));
      fetchData(); // 삭제 후 목록 갱신
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
    <div className="main-container">
      {/* --- 상단 도구 (모바일 반응형 대응) --- */}
      <div className="no-print top-tools">
        <div className="search-wrapper">
          <input 
            type="text" 
            placeholder="모든 일기 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="search-clear">×</button>
          )}
        </div>
        <div className="button-group">
          <button onClick={() => window.print()} className="btn-print">PDF 저장</button>
          <button onClick={() => window.confirm('로그아웃 하시겠습니까?') && signOut(auth)} className="btn-logout">로그아웃</button>
        </div>
      </div>

      {/* --- 검색 결과 --- */}
      {searchTerm && filteredResults.length > 0 && (
        <div className="no-print search-results">
          <h4 style={{ margin: '0 0 10px 0' }}>검색 결과 ({filteredResults.length}건)</h4>
          {filteredResults.map(res => (
            <div key={res.date} onClick={() => onSelectDate(res.date)} className="search-result-item">
              <strong>{res.date}</strong>: {res.content.substring(0, 50)}...
            </div>
          ))}
        </div>
      )}

      {/* --- 달력 섹션 --- */}
      <div className="print-page">
        <header className="calendar-header">
          <button className="no-print nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</button>
          <h2 className="current-month-text">{format(currentMonth, 'yyyy년 MM월')}</h2>
          <button className="no-print nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</button>
        </header>

        {/* 미래 메시지 UI (카드 스타일 + 삭제 버튼) */}
        {futureMemos.length > 0 && (
          <div className="memo-container">
            <h4 className="memo-title">💌 과거에서 도착한 편지</h4>
            <div className="memo-list">
              {futureMemos.map(memo => (
                <div key={memo.id} className="memo-item">
                  <span className="memo-text">{memo.text}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteMemo(memo.id); }} className="memo-del-btn">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 달력 그리드 (모바일 칸 크기 최적화) */}
        <div className="calendar-grid">
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} className={`weekday-label ${d === '일' ? 'sun' : ''}`}>{d}</div>
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entries[dateStr];
            const isMatch = searchTerm && entry?.content?.replace(/<[^>]*>/g, '').toLowerCase().includes(searchTerm.toLowerCase());
            return (
              <div key={dateStr} onClick={() => onSelectDate(dateStr)} className={`calendar-day ${isMatch ? 'matched' : ''} ${!isSameMonth(day, currentMonth) ? 'not-current' : ''}`}>
                <div className={`day-number ${isSameDay(day, new Date()) ? 'today' : ''} ${format(day, 'E') === 'Sun' ? 'sun' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="entry-preview">
                  {entry?.content?.replace(/<[^>]*>/g, '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="print-only">
        {sortedMonthEntries.map(dKey => (
          <div key={dKey} className="print-detail-page">
            <h2 className="print-date-header">{dKey}</h2>
            <div dangerouslySetInnerHTML={{ __html: entries[dKey].content }} className="print-content" />
          </div>
        ))}
      </div>

      <style>{`
        .main-container { max-width: 1000px; margin: 0 auto; padding: 15px; font-family: 'Noto Sans KR', sans-serif; }
        .top-tools { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
        .search-wrapper { position: relative; width: 100%; }
        .search-input { padding: 12px 40px 12px 20px; border-radius: 25px; border: 1px solid #ddd; width: 100%; outline: none; box-sizing: border-box; }
        .search-clear { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); border: none; background: none; cursor: pointer; font-size: 1.2rem; color: #aaa; }
        .button-group { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
        .btn-print { background: #1a1a1a; color: #fff; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 0.85rem; }
        .btn-logout { background: none; border: none; color: #bbb; cursor: pointer; font-size: 0.8rem; text-decoration: underline; }
        .memo-container { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e9ecef; }
        .memo-title { margin: 0 0 10px 0; font-size: 0.9rem; color: #495057; }
        .memo-list { display: flex; flex-direction: column; gap: 8px; }
        .memo-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 10px 15px; border-radius: 8px; border: 1px solid #eee; }
        .memo-text { font-size: 0.85rem; color: #333; }
        .memo-del-btn { border: none; background: none; color: #ccc; cursor: pointer; font-size: 1.1rem; padding: 0 5px; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .current-month-text { margin: 0; font-size: 1.2rem; }
        .nav-btn { border: none; background: none; font-size: 1.3rem; cursor: pointer; padding: 5px 10px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
        .weekday-label { text-align: center; padding: 10px 0; font-size: 0.8rem; font-weight: bold; background: #fafafa; border: 0.5px solid #f0f0f0; color: #555; }
        .weekday-label.sun { color: #ef5350; }
        .calendar-day { height: 85px; border: 0.5px solid #f0f0f0; padding: 5px; cursor: pointer; overflow: hidden; }
        .day-number { font-size: 0.85rem; font-weight: bold; color: #666; }
        .day-number.today { color: #2196f3; }
        .day-number.sun { color: #ef5350; }
        .entry-preview { font-size: 0.65rem; color: #333; margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
        .calendar-day.not-current { background: #f9f9f9; }
        .calendar-day.matched { background: #fff9c4; }
        .search-results { background-color: #fff; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #eee; }
        .search-result-item { padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 0.85rem; }

        @media (min-width: 768px) {
          .top-tools { flex-direction: row; justify-content: space-between; }
          .search-wrapper { width: 350px; }
          .calendar-day { height: 120px; padding: 10px; }
          .entry-preview { font-size: 0.75rem; -webkit-line-clamp: 3; }
          .current-month-text { font-size: 1.5rem; }
        }

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