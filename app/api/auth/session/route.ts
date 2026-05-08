// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token  = searchParams.get('token')
  const userId = searchParams.get('userId')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=no_token', request.url))
  }

  try {
    const supabase = await createServerSupabaseClient()

    // 매직링크 토큰으로 세션 수립
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    })

    if (error) {
      console.error('[Session Error]', error)
      return NextResponse.redirect(new URL('/login?error=session_failed', request.url))
    }

    // 로그인 성공 → 온보딩 또는 채팅으로
    return NextResponse.redirect(new URL('/onboarding', request.url))

  } catch (err: any) {
    console.error('[Session Error]', err)
    return NextResponse.redirect(new URL('/login?error=session_failed', request.url))
  }
}