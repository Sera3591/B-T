import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [showFutureModal, setShowFutureModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [targetMonth, setTargetMonth] = useState('');

  // 1. 기존 데이터 불러오기
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

  // 2. 드래그한 텍스트 추출 및 모달 띄우기
  const handleFutureMemoClick = () => {
    const selection = window.getSelection();
    const text = selection?.toString();
    if (!text) {
      alert('미래로 보낼 글자들을 드래그해서 선택해주세요!');
      return;
    }
    setSelectedText(text);
    setShowFutureModal(true);
  };

  // 3. 미래 메모 저장 (별도 컬렉션 'future_memos'에 저장)
  const saveFutureMemo = async () => {
    if (!targetMonth) return alert('목표 월을 선택해주세요.');

    await addDoc(collection(db, `users/${uid}/future_memos`), {
      text: selectedText,
      targetMonth: targetMonth, // YYYY-MM 형식
      fromDate: date,
      createdAt: new Date()
    });

    alert(`${targetMonth}월로 메모를 보냈습니다!`);
    setShowFutureModal(false);
  };

  const changeColor = (colorValue: string) => {
    document.execCommand('foreColor', false, colorValue);
  };

  const handleInput = () => {
    setSaving(true);
    const content = editorRef.current?.innerHTML || '';
    setDoc(doc(db, `users/${uid}/entries`, date), { content, updatedAt: new Date() })
      .then(() => setSaving(false));
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>←</button>
        {/* 색상 버튼들 */}
        {['#ef5350', '#ff9800', '#fdd835', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'].map(c => (
          <button key={c} onMouseDown={(e) => { e.preventDefault(); changeColor(c); }} style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: c, border: '1px solid #ddd' }} />
        ))}

        {/* 미래 메모 버튼 */}
        <button 
          onClick={handleFutureMemoClick}
          style={{ marginLeft: 'auto', padding: '5px 15px', borderRadius: '20px', border: '1px solid #fbc02d', backgroundColor: '#fffef0', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          ✨ 미래 메모 만들기
        </button>
      </div>

      <div ref={editorRef} contentEditable onInput={handleInput} style={{ minHeight: '500px', outline: 'none', fontSize: '1.2rem', lineHeight: '1.8' }} />

      {/* 미래 메모 설정 모달 */}
      {showFutureModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '350px' }}>
            <h3>미래로 보낼 메모</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>"{selectedText.substring(0, 50)}..."</p>
            <label style={{ display: 'block', marginTop: '20px', fontSize: '0.8rem' }}>목표 월 선택 (YYYY-MM)</label>
            <input type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={saveFutureMemo} style={{ flex: 1, padding: '10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '10px' }}>저장</button>
              <button onClick={() => setShowFutureModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '10px' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
