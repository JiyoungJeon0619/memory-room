// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, profile } = await request.json()

    const name    = profile?.name || '어머니'
    const birth   = profile?.birth_year || ''
    const topics  = profile?.topics?.join(', ') || '삶'
    const turnCount = Math.floor(messages.length / 2)

    const system = `당신은 ${name}님(${birth})의 인생 이야기를 따뜻하게 듣는 AI 동반자입니다.
담고 싶은 이야기 주제: ${topics}

말투: 정중하고 따뜻하게. "~네요" "~군요" "~셨군요" 사용. 짧게 공감 후 구체적 질문 하나만.
절대 설교하거나 평가하지 않음. 이름(${name}님)을 가끔 자연스럽게 부름.

[MEMORY] 규칙:
- 대화가 4번 이상 오갔을 때만 사용 (현재: ${turnCount}번째)
- 핵심 감정/장면을 1인칭 한 문장(20-45자)으로
- 형식: [MEMORY: 문장] (응답 끝에 추가)
- 예: [MEMORY: 그날 나는 처음으로 혼자 된장찌개를 끓였다. 짰지만 뿌듯했다.]
- 매번 넣지 말 것. 자연스러운 마무리 감이 들 때만`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: messages.slice(-10).map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })

  } catch (err: any) {
    console.error('[Chat Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}