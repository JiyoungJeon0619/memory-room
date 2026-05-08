import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return '좋은 아침'
  if (hour < 18) return '좋은 오후'
  return '편안한 저녁'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, profile, isWrapUp } = await request.json()

    const name     = profile?.name || '어머니'
    const birth    = profile?.birth_year || ''
    const topics   = profile?.topics?.join(', ') || '삶'
    const turnCount = Math.floor(messages.length / 2)
    const timeGreeting = getTimeGreeting()

    const system = `당신은 ${name}님(${birth})의 인생 이야기를 따뜻하게 듣는 AI 동반자입니다.
담고 싶은 이야기 주제: ${topics}

말투: 정중하고 따뜻하게. "~네요" "~군요" "~셨군요" 사용. 짧게 공감 후 구체적 질문 하나만.
절대 설교하거나 평가하지 않음. 이름(${name}님)을 가끔 자연스럽게 부름.
시간 인사말은 반드시 "${timeGreeting}"을 사용하세요. "밤"이라는 표현은 절대 사용하지 마세요.

[MEMORY] 규칙:
- 형식: 반드시 응답 맨 마지막 줄에 [MEMORY: 문장] 추가
- 1인칭 시점, 핵심 감정/장면을 한 문장(20-45자)으로
- 예: [MEMORY: 그날 나는 처음으로 혼자 된장찌개를 끓였다. 짰지만 뿌듯했다.]
- 현재 대화 횟수: ${turnCount}번
- 4번 미만이면 절대 사용하지 말 것
- 5번 이상이면 자연스러운 마무리 유도 후 반드시 포함할 것
${isWrapUp ? `
===마무리 모드===
사용자가 오늘 대화를 끝내고 싶어합니다.
1. 오늘 나눈 이야기를 따뜻하게 한두 문장으로 정리해주세요.
2. "${timeGreeting} 되세요" 로 인사를 마무리하세요.
3. 응답 맨 마지막 줄에 반드시 [MEMORY: 문장] 을 추가하세요.
[MEMORY:] 없이 끝내면 절대 안 됩니다.` : ''}`

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