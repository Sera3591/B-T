import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function DetailPage({ uid, date, onBack }: any) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. 기존 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, `users/${uid}/entries`, date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data().content);
      }
    };
    fetchData();
  }, [uid, date]);

  // 2. 자동 저장 기능 (글을 쓸 때마다 1초 뒤 저장)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (content) {
        setSaving(true);
        await setDoc(doc(db, `users/${uid}/entries`, date), {
          content: content,
          updatedAt: new Date()
        });
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [content, uid, date]);

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'serif' }}>
      <button onClick={onBack} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#888', marginBottom: '20px' }}>
        ← 달력으로 돌아가기
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#444' }}>{date}</h2>
        <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{saving ? '저장 중...' : '저장 완료'}</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이곳에 당신의 시간을 기록하세요..."
        style={{
          width: '100%',
          height: '500px',
          marginTop: '20px',
          padding: '20px',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          border: 'none',
          outline: 'none',
          background: 'linear-gradient(to right, #ef5350, #f48fb1, #7e57c2, #2196f3, #26c6da, #43a047, #eeff41, #f9a825, #ff5722)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', // 글자색을 무지개색으로!
          resize: 'none'
        }}
      />
    </div>
  );
}