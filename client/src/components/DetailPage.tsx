import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function DetailPage({ user, date, onBack, highlight }: any) {
  const [content, setContent] = useState('');
  const [memo, setMemo] = useState('');
  const [targetMonth, setTargetMonth] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !date) return;

      const docRef = doc(db, `users/${user.uid}/entries`, date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawContent = docSnap.data().content || '';

        // ✨ 검색어가 있을 때만 '보여주기용'으로 하이라이트 처리
        if (highlight && typeof highlight === 'string' && highlight.trim() !== '') {
          const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${safeHighlight})`, 'gi');
          // 원본 내용은 건드리지 않고, 화면에 보일 때만 노란 배경 추가
          const highlighted = rawContent.replace(regex, '<mark style="background-color: #ffeb3b;">$1</mark>');
          setContent(highlighted);
        } else {
          setContent(rawContent);
        }
      }
    };
    loadData();
  }, [user?.uid, date, highlight]);

  const saveEntry = async () => {
    // ⚠️ 중요: 저장할 때는 하이라이트용 태그(<mark>)를 모두 제거하고 순수 글자만 저장
    const cleanContent = content.replace(/<mark[^>]*>|<\/mark>/g, '');
    await setDoc(doc(db, `users/${user.uid}/entries`, date), { content: cleanContent });
    alert('저장되었습니다.');
  };

  const sendFutureMemo = async () => {
    if (!memo || !targetMonth) return alert('내용과 목표 월을 입력하세요.');
    await addDoc(collection(db, `users/${user.uid}/future_memos`), {
      text: memo,
      targetMonth,
      fromDate: date,
      createdAt: new Date()
    });
    alert('미래로 전송되었습니다!');
    setMemo('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <button onClick={onBack} style={{ marginBottom: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#2196f3', fontSize: '1rem' }}>← 달력으로 돌아가기</button>

      <h2 style={{ marginBottom: '20px' }}>{date}의 기록</h2>

      <div style={{ marginBottom: '40px', backgroundColor: '#fff' }}>
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          style={{ height: '400px', marginBottom: '50px' }} 
        />
        <button onClick={saveEntry} style={{ width: '100%', padding: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>기록 저장하기</button>
      </div>

      <div style={{ padding: '30px', backgroundColor: '#eee9e0', borderRadius: '15px' }}>
        <h3 style={{ marginTop: 0 }}>💌 미래의 나에게 보내는 메모</h3>
        <textarea 
          value={memo} 
          onChange={(e) => setMemo(e.target.value)} 
          placeholder="먼 훗날 이 달의 달력에 나타날 메시지를 적어보세요." 
          style={{ width: '100%', height: '100px', padding: '15px', borderRadius: '10px', border: '1px solid #d1c8b8', marginBottom: '15px' }} 
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="month" value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1c8b8' }} />
          <button onClick={sendFutureMemo} style={{ flex: 1, background: '#8b7e66', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>전송하기</button>
        </div>
      </div>
    </div>
  );
}