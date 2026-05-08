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

    const name         = profile?.name || '어머니'
    const birth        = profile?.birth_year || ''
    const topics       = profile?.topics?.join(', ') || '삶'
    const gender       = profile?.gender || ''
    const turnCount    = Math.floor(messages.length / 2)
    const timeGreeting = getTimeGreeting()

    const genderNote = gender === '여성'
      ? '여성이시며 며느리/어머니/할머니 관점의 표현을 자연스럽게 사용하세요.'
      : gender === '남성'
      ? '남성이시며 아버지/할아버지 관점의 표현을 자연스럽게 사용하세요.'
      : ''

    const wrapUpPrompt = isWrapUp
      ? '\n\n===지금 바로 마무리===\n' +
        '지금 즉시 아래 형식으로 응답하세요:\n' +
        '1. 오늘 나눈 이야기를 한두 문장으로 따뜻하게 정리\n' +
        '2. ' + timeGreeting + ' 되세요, ' + name + '님. 으로 마무리\n' +
        '3. 응답의 맨 마지막 줄에 반드시 아래 형식으로 기억 추가:\n' +
        '[MEMORY: 오늘 나눈 이야기의 핵심 장면을 1인칭으로 한 문장]\n\n' +
        '절대로 [MEMORY: ...] 없이 끝내지 마세요.\n' +
        '예시 마지막 줄: [MEMORY: 그날 선생님이 지어준 별명이 싫으면서도 좋았다.]'
      : ''

    const normalPrompt = !isWrapUp && turnCount >= 5
      ? '\n\n대화가 ' + turnCount + '번 오갔습니다. 슬슬 마무리를 유도하되 자연스러운 흐름에서 [MEMORY: 문장]을 포함해주세요.'
      : ''

    const system =
      '당신은 ' + name + '님(' + birth + ')의 인생 이야기를 따뜻하게 듣는 AI 동반자입니다.\n' +
      (genderNote ? genderNote + '\n' : '') +
      '담고 싶은 이야기 주제: ' + topics + '\n\n' +
      '말투: 정중하고 따뜻하게. ~네요 ~군요 ~셨군요 사용. 짧게 공감 후 구체적 질문 하나만.\n' +
      '절대 설교하거나 평가하지 않음. 이름(' + name + '님)을 가끔 자연스럽게 부름.\n' +
      '시간 인사말은 반드시 ' + timeGreeting + ' 을 사용. 밤이라는 표현은 절대 사용 금지.\n\n' +
      '[MEMORY] 일반 규칙:\n' +
      '- 형식: [MEMORY: 문장] 응답 맨 마지막 줄에만\n' +
      '- 1인칭 시점, 핵심 감정/장면을 한 문장(20-45자)\n' +
      '- 현재 대화 횟수: ' + turnCount + '번\n' +
      '- 4번 미만이면 절대 사용하지 말 것\n' +
      normalPrompt +
      wrapUpPrompt

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
    console.log('[isWrapUp]', isWrapUp, '[turnCount]', turnCount)
    console.log('[Reply preview]', reply.slice(-100))

    return NextResponse.json({ reply })

  } catch (err: any) {
    console.error('[Chat Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}