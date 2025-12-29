import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [targetMonth, setTargetMonth] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, `users/${uid}/entries`, date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && editorRef.current) {
        editorRef.current.innerHTML = docSnap.data().content || '';
      }
    };
    fetchData();
  }, [uid, date]);

  const handleFutureMemo = () => {
    const text = window.getSelection()?.toString().trim();
    if (!text) return alert('글자를 드래그한 후 눌러주세요!');
    setSelectedText(text);
    setShowModal(true);
  };

  const saveFutureMemo = async () => {
    if (!targetMonth) return alert('월을 선택해주세요.');
    await addDoc(collection(db, `users/${uid}/future_memos`), {
      text: selectedText,
      targetMonth,
      fromDate: date, // 어느 날짜 일기에서 보냈는지 기록
      createdAt: new Date()
    });
    alert('미래로 메모를 보냈습니다!');
    setShowModal(false);
  };

  const changeColor = (color: string) => document.execCommand('foreColor', false, color);

  // 💡 본문 수정 시 미래 메모와 대조하여 삭제하는 로직
  const handleInput = async () => {
    setSaving(true);
    const newContent = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';

    // 1. 본문 내용 저장
    await setDoc(doc(db, `users/${uid}/entries`, date), {
      content: newContent,
      updatedAt: new Date()
    });

    // 2. 이 날짜(date)에서 보냈던 미래 메모들 가져오기
    const q = query(
      collection(db, `users/${uid}/future_memos`), 
      where("fromDate", "==", date)
    );
    const querySnapshot = await getDocs(q);

    // 3. 미래 메모의 텍스트가 본문(plainText)에 없으면 삭제
    querySnapshot.forEach(async (memoDoc) => {
      const memoData = memoDoc.data();
      if (!plainText.includes(memoData.text)) {
        await deleteDoc(doc(db, `users/${uid}/future_memos`, memoDoc.id));
        console.log("본문에서 사라진 미래 메모를 삭제했습니다.");
      }
    });

    setSaving(false);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', alignItems: 'center' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#555' }}>{date}</span>
        <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
          {['#ef5350', '#ff9800', '#fdd835', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'].map(c => (
            <button key={c} onMouseDown={(e) => { e.preventDefault(); changeColor(c); }} style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          ))}
        </div>
        <button onClick={handleFutureMemo} style={{ marginLeft: 'auto', backgroundColor: '#fff', border: '1px solid #fbc02d', borderRadius: '20px', padding: '6px 15px', cursor: 'pointer', fontSize: '0.85rem', color: '#f9a825', fontWeight: 600 }}>✨ 미래로 보내기</button>
      </div>

      <div 
        ref={editorRef} 
        contentEditable 
        onInput={handleInput} 
        style={{ 
          minHeight: '600px', 
          outline: 'none', 
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: '1.1rem', 
          lineHeight: '2', 
          padding: '40px', 
          backgroundColor: '#fff', 
          borderRadius: '5px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          backgroundImage: 'linear-gradient(#f1f1f1 1px, transparent 1px)',
          backgroundSize: '100% 2.2rem',
          color: '#444'
        }} 
      />

      {showModal && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000 }}>
          <div style={{ backgroundColor:'#fff', padding:'25px', borderRadius:'15px', width:'300px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>미래의 언제 보여줄까요?</h4>
            <input type="month" onChange={(e)=>setTargetMonth(e.target.value)} style={{ width:'100%', padding:'10px', marginBottom: '15px', boxSizing: 'border-box' }} />
            <button onClick={saveFutureMemo} style={{ width:'100%', padding:'12px', backgroundColor:'#333', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', marginBottom: '10px' }}>저장하기</button>
            <button onClick={()=>setShowModal(false)} style={{ width:'100%', padding:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}