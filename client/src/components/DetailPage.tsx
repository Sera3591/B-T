import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack }: any) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#333333'); // 기본 글씨 색 (진한 회색)
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

  // 1. 기존 데이터(내용 + 색상) 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, `users/${uid}/entries`, date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || '');
        setColor(data.color || '#333333'); // 저장된 색이 있으면 불러오기
      }
    };
    fetchData();
  }, [uid, date]);

  // 2. 내용이나 색상이 바뀔 때마다 자동 저장
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (content || color !== '#333333') {
        setSaving(true);
        await setDoc(doc(db, `users/${uid}/entries`, date), {
          content: content,
          color: color, // 선택한 색상 저장
          updatedAt: new Date()
        });
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [content, color, uid, date]);

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif' }}>
      <button onClick={onBack} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#888', marginBottom: '20px' }}>
        ← 달력으로 돌아가기
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#444' }}>{date}</h2>
        <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{saving ? '저장 중...' : '저장 완료'}</span>
      </div>

      {/* 🎨 색상 선택 버튼 7개 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '15px' }}>
        {colors.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: c.value,
              border: color === c.value ? '3px solid #333' : '1px solid #ddd',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            title={c.name}
          />
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#666', alignSelf: 'center' }}>펜 색상 선택</div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이곳에 당신의 시간을 기록하세요..."
        style={{
          width: '100%',
          height: '500px',
          padding: '20px',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          border: '1px solid #eee',
          borderRadius: '10px',
          outline: 'none',
          color: color, // 선택한 색상이 글씨에 적용됩니다
          resize: 'none',
          backgroundColor: '#fff'
        }}
      />
    </div>
  );
}
