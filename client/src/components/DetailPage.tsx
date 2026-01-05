import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, query, getDocs, where, deleteDoc, addDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack, searchTerm }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [allEntries, setAllEntries] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [targetMonth, setTargetMonth] = useState('');

  // 현재 날짜 기준 달력 데이터 생성
  const currentMonthDate = new Date(date);
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd)
  });

  useEffect(() => {
    const fetchData = async () => {
      // 1. 현재 페이지 일기 데이터
      const docRef = doc(db, `users/${uid}/entries`, date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && editorRef.current) {
        let content = docSnap.data().content || '';
        if (searchTerm) {
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          content = content.replace(regex, '<mark style="background-color: #fff9c4; color: inherit;">$1</mark>');
        }
        editorRef.current.innerHTML = content;
      }

      // 2. 출력을 위한 해당 월의 전체 일기 데이터 로드
      const q = query(collection(db, `users/${uid}/entries`));
      const querySnapshot = await getDocs(q);
      const data: any = {};
      querySnapshot.forEach((doc) => {
        if (doc.id.startsWith(date.substring(0, 7))) {
          data[doc.id] = doc.data();
        }
      });
      setAllEntries(data);
    };
    fetchData();
  }, [uid, date, searchTerm]);

  // --- 기존 기능 유지 ---
  const changeColor = (color: string) => document.execCommand('foreColor', false, color);

  const handleInput = async () => {
    const newContent = editorRef.current?.innerHTML || '';
    await setDoc(doc(db, `users/${uid}/entries`, date), { content: newContent, updatedAt: new Date() });
  };

  const handleFutureMemo = () => {
    const text = window.getSelection()?.toString().trim();
    if (!text) return alert('글자를 드래그한 후 눌러주세요!');
    setSelectedText(text);
    setShowModal(true);
  };

  const saveFutureMemo = async () => {
    if (!targetMonth) return alert('월을 선택해주세요.');
    await addDoc(collection(db, `users/${uid}/future_memos`), {
      text: selectedText, targetMonth, fromDate: date, createdAt: new Date()
    });
    alert('미래로 메모를 보냈습니다!');
    setShowModal(false);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 화면 상단 도구 모음 (출력 시 제외) */}
      <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
        <button onClick={() => window.print()} style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>PDF 저장</button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{date}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['#ef5350', '#ff9800', '#fdd835', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'].map(c => (
            <button key={c} onMouseDown={(e) => { e.preventDefault(); changeColor(c); }} style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
        <button onClick={handleFutureMemo} style={{ marginLeft: 'auto', backgroundColor: '#eee', border: 'none', borderRadius: '8px', padding: '8px 15px', cursor: 'pointer' }}>✉ 미래로 보내기</button>
      </div>

      {/* 1. 웹 화면용 에디터 (출력 시 제외) */}
      <div className="no-print" ref={editorRef} contentEditable onInput={handleInput} style={{ minHeight: '600px', outline: 'none', padding: '40px', backgroundColor: '#fff', borderRadius: '5px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', lineHeight: '2.2', backgroundImage: 'linear-gradient(#f1f1f1 1px, transparent 1px)', backgroundSize: '100% 2.2rem' }} />

      {/* 2. PDF 출력 전용 영역 (화면엔 안 보임) */}
      <div className="print-only">
        {/* 페이지 1: 해당 월 달력 */}
        <div className="print-page">
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{date.substring(0, 4)}년 {date.substring(5, 7)}월 기록장</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #000' }}>
            {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ textAlign:'center', border:'1px solid #000', padding:'5px', fontWeight:'bold' }}>{d}</div>)}
            {calendarDays.map(day => {
              const dStr = format(day, 'yyyy-MM-dd');
              return (
                <div key={dStr} style={{ border:'1px solid #000', height:'80px', padding:'5px', backgroundColor: isSameMonth(day, currentMonthDate) ? '#fff' : '#eee' }}>
                  <div style={{ fontSize:'0.8rem' }}>{format(day, 'd')}</div>
                  <div style={{ fontSize:'0.6rem', color:'#333' }}>{allEntries[dStr]?.content?.replace(/<[^>]*>/g, '').substring(0, 15)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 페이지 2~: 작성된 모든 일기 내용 */}
        {Object.keys(allEntries).sort().map(dKey => (
          <div key={dKey} className="print-page" style={{ marginTop: '50px', pageBreakBefore: 'always' }}>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>{dKey}</h2>
            <div dangerouslySetInnerHTML={{ __html: allEntries[dKey].content }} style={{ lineHeight: '2', fontSize: '1.1rem' }} />
          </div>
        ))}
      </div>

      {showModal && (
        <div className="no-print" style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000 }}>
          <div style={{ backgroundColor:'#fff', padding:'25px', borderRadius:'15px', width:'300px' }}>
            <h4>미래의 언제 보여줄까요?</h4>
            <input type="month" onChange={(e)=>setTargetMonth(e.target.value)} style={{ width:'100%', padding:'10px', marginBottom: '15px' }} />
            <button onClick={saveFutureMemo} style={{ width:'100%', padding:'12px', backgroundColor:'#1a1a1a', color:'#fff', border:'none', borderRadius:'10px' }}>저장하기</button>
            <button onClick={()=>setShowModal(false)} style={{ width:'100%', marginTop: '10px', border: 'none', background: 'none', cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}

      <style>{`
        .print-only { display: none; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-page { page-break-after: always; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}