import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
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
    const text = window.getSelection()?.toString();
    if (!text) return alert('글자를 드래그한 후 눌러주세요!');
    setSelectedText(text);
    setShowModal(true);
  };

  const saveFutureMemo = async () => {
    if (!targetMonth) return alert('월을 선택해주세요.');
    await addDoc(collection(db, `users/${uid}/future_memos`), {
      text: selectedText,
      targetMonth,
      fromDate: date,
      createdAt: new Date()
    });
    alert('미래로 메모를 보냈습니다!');
    setShowModal(false);
  };

  const changeColor = (color: string) => document.execCommand('foreColor', false, color);

  const handleInput = () => {
    setSaving(true);
    setDoc(doc(db, `users/${uid}/entries`, date), {
      content: editorRef.current?.innerHTML,
      updatedAt: new Date()
    }).then(() => setSaving(false));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack}>← 달력</button>
        {['#ef5350', '#ff9800', '#fdd835', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'].map(c => (
          <button key={c} onMouseDown={(e) => { e.preventDefault(); changeColor(c); }} style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer' }} />
        ))}
        <button onClick={handleFutureMemo} style={{ marginLeft: 'auto', backgroundColor: '#fffef0', border: '1px solid #fbc02d', borderRadius: '15px', padding: '5px 10px', cursor: 'pointer' }}>✨ 미래 메모</button>
      </div>

      <div ref={editorRef} contentEditable onInput={handleInput} style={{ minHeight: '500px', outline: 'none', fontSize: '1.2rem', border: '1px solid #eee', padding: '15px', borderRadius: '10px' }} />

      {showModal && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:'25px', borderRadius:'15px', width:'300px' }}>
            <h4>미래의 언제 보여줄까요?</h4>
            <input type="month" onChange={(e)=>setTargetMonth(e.target.value)} style={{ width:'100%', padding:'10px', margin:'10px 0' }} />
            <button onClick={saveFutureMemo} style={{ width:'100%', padding:'10px', backgroundColor:'#333', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer' }}>저장하기</button>
            <button onClick={()=>setShowModal(false)} style={{ width:'100%', padding:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
