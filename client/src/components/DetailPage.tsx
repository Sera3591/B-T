import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack, highlightTerm }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [targetMonth, setTargetMonth] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, `users/${uid}/entries`, date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && editorRef.current) {
        let content = docSnap.data().content || '';
        if (highlightTerm) {
          const regex = new RegExp(`(${highlightTerm})`, 'gi');
          content = content.replace(regex, '<mark style="background-color: #ffeb3b;">$1</mark>');
        }
        editorRef.current.innerHTML = content;
      }
    };
    fetchData();
  }, [uid, date, highlightTerm]);

  const handleInput = async () => {
    await setDoc(doc(db, `users/${uid}/entries`, date), {
      content: editorRef.current?.innerHTML || '',
      updatedAt: new Date()
    });
  };

  const changeColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    handleInput();
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
    alert('미래로 전송 완료!');
    setShowModal(false);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['#ef5350', '#ff9800', '#fdd835', '#4caf50', '#2196f3', '#9c27b0', '#333'].map(c => (
            <button key={c} onMouseDown={(e) => { e.preventDefault(); changeColor(c); }} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
        <button onClick={handleFutureMemo} style={{ marginLeft: 'auto', padding: '8px 15px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>✉ 미래로 보내기</button>
      </div>

      <div ref={editorRef} contentEditable onInput={handleInput} style={{ minHeight: '600px', padding: '30px', border: '1px solid #f0f0f0', borderRadius: '10px', outline: 'none', lineHeight: '2.2', fontSize: '1.1rem', backgroundColor: '#fff' }} />

      {showModal && (
        <div style={{ position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
          <div style={{ backgroundColor:'#fff', padding:'25px', borderRadius:'15px', width:'300px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>미래의 언제 보여줄까요?</h4>
            <input type="month" onChange={(e)=>setTargetMonth(e.target.value)} style={{ width:'100%', padding:'10px', marginBottom: '15px' }} />
            <button onClick={saveFutureMemo} style={{ width:'100%', padding:'12px', backgroundColor:'#1a1a1a', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer' }}>저장하기</button>
            <button onClick={()=>setShowModal(false)} style={{ width:'100%', padding:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}