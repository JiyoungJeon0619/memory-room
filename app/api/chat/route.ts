import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, profile, isWrapUp } = await request.json()

    const name    = profile?.name || '어머니'
    const birth   = profile?.birth_year || ''
    const topics  = profile?.topics?.join(', ') || '삶'
    const turnCount = Math.floor(messages.length / 2)

    const wrapUpInstruction = isWrapUp ? `
지금 사용자가 오늘 대화를 마무리하고 싶어합니다.
따뜻하게 오늘 나눈 이야기를 한 문장으로 요약하며 마무리 인사를 건네주세요.
그리고 반드시 [MEMORY: 문장] 형식으로 오늘의 핵심 기억을 담아주세요.` : ''

    const shouldWrapUp = !isWrapUp && turnCount >= 5 ? `
대화가 ${turnCount}번 오갔습니다. 이제 자연스럽게 마무리를 유도해주세요.
오늘 나눈 이야기 중 가장 인상적인 장면을 언급하며 따뜻하게 마무리하고,
반드시 [MEMORY: 문장] 형식으로 기억을 담아주세요.` : ''

    const system = `당신은 ${name}님(${birth})의 인생 이야기를 따뜻하게 듣는 AI 동반자입니다.
담고 싶은 이야기 주제: ${topics}

말투: 정중하고 따뜻하게. "~네요" "~군요" "~셨군요" 사용. 짧게 공감 후 구체적 질문 하나만.
절대 설교하거나 평가하지 않음. 이름(${name}님)을 가끔 자연스럽게 부름.

[MEMORY] 규칙:
- 형식: [MEMORY: 문장] (응답 끝에 추가)
- 1인칭 시점, 핵심 감정/장면을 한 문장(20-45자)으로
- 예: [MEMORY: 그날 나는 처음으로 혼자 된장찌개를 끓였다. 짰지만 뿌듯했다.]
- 현재 대화 횟수: ${turnCount}번
- 4번 미만이면 절대 사용하지 말 것
${shouldWrapUp}
${wrapUpInstruction}`

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