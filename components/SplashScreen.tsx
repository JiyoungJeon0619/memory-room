'use client'
// components/SplashScreen.tsx

import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()

  function handleKakaoLogin() {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=ad24f55b011490517d71c8562bc3c92d&redirect_uri=https://memory-room-tk2d.vercel.app/api/auth/kakao/callback&response_type=code`    window.location.href = kakaoAuthUrl
    }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, #FDFAF4 0%, #F5EAD5 50%, #EEE0C0 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Gowun Batang', serif",
      padding: '48px 28px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* 배경 블러 원 */}
      <div style={{ position:'absolute', width:280, height:280, borderRadius:'50%', background:'#F0D4C8', filter:'blur(60px)', opacity:0.25, top:-80, left:-80 }} />
      <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'#C8DCC8', filter:'blur(60px)', opacity:0.25, bottom:-50, right:-50 }} />

      <div style={{ position:'relative', zIndex:1, maxWidth:360, width:'100%' }}>

        {/* 엠블럼 */}
        <div style={{
          width:88, height:88, borderRadius:'50%', margin:'0 auto 32px',
          background:'linear-gradient(135deg, #F5E4D8, #EDD0BC)',
          boxShadow:'0 12px 40px rgba(196,130,106,0.22)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:38,
        }}>
          📖
        </div>

        {/* 타이틀 */}
        <h1 style={{ fontSize:38, fontWeight:700, color:'#28200F', marginBottom:12, letterSpacing:'-0.02em' }}>
          기억의 방
        </h1>
        <p style={{ fontSize:16, color:'#9A8870', lineHeight:1.9, marginBottom:52 }}>
          당신의 이야기가 머무는 곳<br />
          오늘도 한 페이지가 쌓입니다
        </p>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          style={{
            width:'100%', padding:'18px 24px',
            background:'#FEE500', border:'none', borderRadius:14,
            fontSize:17, fontFamily:"'Gowun Batang', serif",
            color:'#28200F', cursor:'pointer', fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow:'0 6px 20px rgba(254,229,0,0.4)',
          }}
        >
          <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" width={24} height={24} alt="kakao" />
          카카오로 시작하기
        </button>

      </div>
    </div>
  )
}