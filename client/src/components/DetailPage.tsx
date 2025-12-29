import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack }: any) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  // 7가지 색상 리스트
  const colors = [
    { name: 'Red', value: '#ef5350' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Yellow', value: '#fdd835' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Indigo', value: '#3f51b5' },
    { name: 'Purple', value: '#9c27b0' }
  ];

  // 1. 기존 데이터 불러오기 (HTML 구조 그대로 가져옴)
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

  // 2. 색상 변경 함수 (드래그한 부분이나 앞으로 쓸 글자색 변경)
  const changeColor = (colorValue: string) => {
    document.execCommand('foreColor', false, colorValue);
    if (editorRef.current) editorRef.current.focus();
  };

  // 3. 자동 저장 (내용 변경 감지)
  const handleInput = () => {
    const delayDebounceFn = setTimeout(async () => {
      if (editorRef.current) {
        setSaving(true);
        await setDoc(doc(db, `users/${uid}/entries`, date), {
          content: editorRef.current.innerHTML, // HTML 구조(색상 포함)를 통째로 저장
          updatedAt: new Date()
        });
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif' }}>
      <button onClick={onBack} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#888', marginBottom: '20px' }}>
        ← 달력으로 돌아가기
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#444' }}>{date}</h2>
        <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{saving ? '저장 중...' : '저장 완료'}</span>
      </div>

      {/* 🎨 색상 선택 버튼 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '15px', position: 'sticky', top: '10px', zIndex: 10 }}>
        {colors.map((c) => (
          <button
            key={c.value}
            onMouseDown={(e) => {
              e.preventDefault(); // 포커스 해제 방지
              changeColor(c.value);
            }}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: c.value,
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
          />
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666', alignSelf: 'center' }}>원하는 곳을 드래그하고 색을 누르세요</div>
      </div>

      {/* 📝 편집 가능한 영역 (textarea 대신 사용) */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          width: '100%',
          minHeight: '500px',
          padding: '20px',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          border: '1px solid #eee',
          borderRadius: '10px',
          outline: 'none',
          backgroundColor: '#fff',
          whiteSpace: 'pre-wrap',
          overflowY: 'auto'
        }}
      />
    </div>
  );
}
