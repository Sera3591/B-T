import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';

export default function MonthView({ user, onSelectDate }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [futureMemos, setFutureMemos] = useState<any[]>([]);

  useEffect(() => {
    const fetchFutureMemos = async () => {
      const monthStr = format(currentMonth, 'yyyy-MM');
      const q = query(
        collection(db, `users/${user.uid}/future_memos`),
        where("targetMonth", "==", monthStr)
      );
      const querySnapshot = await getDocs(q);
      const memos = querySnapshot.docs.map(doc => doc.data());
      setFutureMemos(memos);
    };
    fetchFutureMemos();
  }, [currentMonth, user.uid]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* 미래 메모 도착 알림 영역 */}
      {futureMemos.length > 0 && (
        <div style={{ backgroundColor: '#fffef0', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #fbc02d' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fbc02d' }}>✨ 과거에서 도착한 메모가 있습니다</h3>
          {futureMemos.map((memo, idx) => (
            <div key={idx} style={{ padding: '10px 0', borderBottom: idx === futureMemos.length - 1 ? 'none' : '1px dashed #eee' }}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{memo.text}</p>
              <small style={{ color: '#aaa' }}>{memo.fromDate}에 작성함</small>
            </div>
          ))}
        </div>
      )}

      {/* ... (이하 기존 달력 코드와 동일) */}
    </div>
  );
}
