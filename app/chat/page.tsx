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
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#28200F', marginBottom: 12 }}>
        오늘의 이야기
      </h1>
      <p style={{ fontSize: 16, color: '#9A8870', lineHeight: 1.9, marginBottom: 40 }}>
        채팅 기능을 준비 중이에요.<br />
        곧 대화를 나눌 수 있을 거예요.
      </p>
      <button
        onClick={() => router.push('/book')}
        style={{
          padding: '16px 32px', background: '#C4826A',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 17, cursor: 'pointer',
          fontFamily: "'Gowun Batang', serif",
        }}
      >
        📚 내 책 보기
      </button>
    </div>
  )
}