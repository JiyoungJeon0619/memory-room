// app/chat/page.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF6EF 0%, #F5EAD8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Gowun Batang', serif",
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>🌸</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#28200F', marginBottom: 12 }}>
        기억의 방
      </h1>
      <p style={{ fontSize: 16, color: '#9A8870', lineHeight: 1.9, marginBottom: 40 }}>
        로그인 성공! 🎉<br />
        채팅 화면을 곧 만들게요.
      </p>
      <button
        onClick={() => router.push('/book')}
        style={{
          padding: '16px 32px', background: '#C4826A',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 17, cursor: 'pointer',
          fontFamily: "'Gowun Batang', serif",
          marginBottom: 12,
        }}
      >
        📚 내 책 보기
      </button>
    </div>
  )
}