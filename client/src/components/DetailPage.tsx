// ... (상단 import 및 State 부분은 동일)

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
          fontSize: '1.25rem', 
          lineHeight: '2', 
          padding: '40px', 
          backgroundColor: '#fff', 
          borderRadius: '5px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          backgroundImage: 'linear-gradient(#f1f1f1 1px, transparent 1px)',
          backgroundSize: '100% 2.5rem', // 줄노트 효과
          color: '#444'
        }} 
      />

      {/* ... (모달 코드는 이전과 동일) */}
    </div>
  );
}