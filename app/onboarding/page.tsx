// app/onboarding/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF6EF 0%, #F5EBD8 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Gowun Batang', serif",
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 24 }}>📖</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#28200F', marginBottom: 12 }}>
        어서 오세요
      </h1>
      <p style={{ fontSize: 16, color: '#9A8870', lineHeight: 1.9, marginBottom: 40 }}>
        기억의 방에 오신 걸 환영해요.<br />
        곧 대화 화면이 준비될 거예요.
      </p>
      <button
        onClick={() => router.push('/chat')}
        style={{
          padding: '16px 32px', background: '#C4826A',
          color: 'white', border: 'none', borderRadius: 14,
          fontSize: 17, cursor: 'pointer',
          fontFamily: "'Gowun Batang', serif",
        }}
      >
        시작하기 →
      </button>
    </div>
  )
}