import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Loading...</div>;

  if (!user) return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif'}}>
      <h1 style={{fontSize: '2rem', marginBottom: '1rem'}}>Being and Time</h1>
      <p style={{color: '#666', marginBottom: '2rem'}}>A quiet space for your thoughts</p>
      <button 
        onClick={() => signInWithPopup(auth, googleProvider)} 
        style={{padding: '12px 24px', fontSize: '1rem', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff'}}
      >
        Continue with Google
      </button>
    </div>
  );

  return (
    <div style={{padding: '20px'}}>
      <h1>Welcome, {user.displayName}!</h1>
      <p>로그인에 성공했습니다. 이제 달력 화면을 만들 차례입니다.</p>
      <button onClick={() => auth.signOut()}>Logout</button>
    </div>
  );
}
