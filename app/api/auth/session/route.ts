// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=no_token', request.url))
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    })

    if (error) {
      console.error('[Session Error]', error)
      return NextResponse.redirect(new URL('/login?error=session_failed', request.url))
    }

    // 프로필 확인 — 이름이 없으면 온보딩, 있으면 채팅
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=no_user', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, topics')
      .eq('id', user.id)
      .single()

    const isNewUser = !profile?.name || profile.name === ''

    if (isNewUser) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    } else {
      return NextResponse.redirect(new URL('/chat', request.url))
    }

  } catch (err: any) {
    console.error('[Session Error]', err)
    return NextResponse.redirect(new URL('/login?error=session_failed', request.url))
  }
}