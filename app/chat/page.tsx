'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WC = [
  { bg: 'linear-gradient(135deg,#FFE4D6,#FFB89A,#E8967A)', emoji: '🌸' },
  { bg: 'linear-gradient(135deg,#D4E8D4,#A0C8A0,#5A8A5A)', emoji: '🌿' },
  { bg: 'linear-gradient(135deg,#FFF0D0,#FFD880,#C8A040)', emoji: '🌼' },
  { bg: 'linear-gradient(135deg,#D0E8F0,#88C0D8,#4880A8)', emoji: '🌊' },
  { bg: 'linear-gradient(135deg,#E8DFF0,#C0A8D8,#8870A8)', emoji: '✿' },
  { bg: 'linear-gradient(135deg,#F8E8D0,#E0C090,#B08040)', emoji: '🍂' },
]

const QUESTION_POOL: Record<string, string[]> = {
  '나의 이야기': [
    '어릴 때 별명이 있으셨나요? 어떻게 생긴 별명이었어요?',
    '처음으로 돈을 직접 벌었던 게 언제였는지 기억나세요?',
    '살면서 가장 용감했다고 느낀 순간이 언제였나요?',
    '학창 시절에 가장 좋아했던 과목이나 선생님이 기억나세요?',
    '지금의 나를 만든 사람이 있다면 누구라고 생각하세요?',
  ],
  '가족 이야기': [
    '가족 중에 가장 먼저 떠오르는 얼굴은 누구인가요?',
    '아이를 처음 안았던 그 순간이 어땠는지 들려주실 수 있어요?',
    '결혼하시기 전날 밤, 어떤 기분이었는지 기억나세요?',
    '부모님께 끝내 못다 한 말이 있다면 어떤 말일까요?',
  ],
  '고향과 추억': [
    '어릴 때 자주 놀던 장소가 기억나세요?',
    '고향에서 가장 좋아했던 계절은 언제였나요?',
    '처음 고향을 떠났던 날이 기억나세요? 어떤 기분이었어요?',
    '고향 음식 중 지금도 생각나는 맛이 있으신가요?',
  ],
  '음식과 요리': [
    '어머니나 할머니가 해주시던 음식 중 지금도 생각나는 게 있으세요?',
    '처음으로 직접 요리해봤던 게 뭐였는지 기억나세요?',
    '가족들이 제일 좋아했던 내 음식이 뭐였나요?',
    '특별한 날에 꼭 만들던 음식이 있었나요?',
  ],
  '일과 직업': [
    '처음 일을 시작하셨을 때 몇 살이셨어요? 어떤 일이었나요?',
    '일하면서 가장 뿌듯했던 순간이 언제였는지 기억나세요?',
    '일 말고 사실 하고 싶었던 다른 꿈이 있으셨나요?',
  ],
  '꿈과 바람': [
    '어릴 때 장래희망이 뭐였는지 기억나세요?',
    '가장 행복했던 시절이 언제였던 것 같으세요?',
    '지금 새로 배우고 싶은 것이 있으신가요?',
  ],
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [pendingMemory, setPendingMemory] = useState<{ quote: string; saved: boolean } | null>(null)
  const [memoryCount, setMemoryCount] = useState(0)
  const [mode, setMode] = useState<'type' | 'voice'>('type')

  const { status: voiceStatus, interimText, startRecording, stopRecording } = useVoiceInput({
    onTranscript: (text) => {
      sendMessage(text)
      setMode('type')
    },
  })

  useEffect(() => { initChat() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  async function initChat() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)

    const { count } = await supabase.from('memories').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    setMemoryCount(count || 0)

    const { data: session } = await supabase.from('sessions').insert({ user_id: user.id, title: '새 대화' }).select().single()
    if (session) setSessionId(session.id)

    const name = prof?.name || '어머니'
    const topic = prof?.topics?.[0] || '나의 이야기'
    const pool = QUESTION_POOL[topic] || QUESTION_POOL['나의 이야기']
    const randomQ = pool[Math.floor(Math.random() * pool.length)]
    const greeting = `${name}님, 오늘도 오셨네요. 🌸\n\n${randomQ}`

    setMessages([{ id: 'init', role: 'assistant', content: greeting }])

    if (session) {
      await supabase.from('messages').insert({ session_id: session.id, user_id: user.id, role: 'assistant', content: greeting })
    }
  }

  async function sendMessage(text?: string) {
    const content = text || input.trim()
    if (!content || isTyping) return
    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])

    if (sessionId) {
      await supabase.from('messages').insert({ session_id: sessionId, user_id: user.id, role: 'user', content })
    }

    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), profile }),
      })
      const data = await res.json()
      const reply: string = data.reply || ''
      const memMatch = reply.match(/\[MEMORY:(.*?)\]/)
      const cleanReply = reply.replace(/\[MEMORY:.*?\]/g, '').trim()

      const aiMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: cleanReply }
      setMessages(prev => [...prev, aiMsg])

      if (sessionId) {
        await supabase.from('messages').insert({ session_id: sessionId, user_id: user.id, role: 'assistant', content: cleanReply })
      }

      if (memMatch) {
        setTimeout(() => setPendingMemory({ quote: memMatch[1].trim(), saved: false }), 600)
      }
    } catch {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: '잠시 연결이 끊겼어요. 다시 시도해주세요.' }])
    }

    setIsTyping(false)
  }

  async function saveMemory() {
    if (!pendingMemory) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: mem } = await supabase.from('memories').insert({
      user_id: user.id, session_id: sessionId,
      quote: pendingMemory.quote, wc_index: memoryCount % WC.length, image_status: 'none',
    }).select().single()

    if (mem) {
      fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: mem.id, sessionId, memoryQuote: pendingMemory.quote, topic: profile?.topics?.[0] || '삶', messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      })
    }

    setPendingMemory({ ...pendingMemory, saved: true })
    setMemoryCount(prev => prev + 1)
    setTimeout(() => setPendingMemory(null), 2000)
  }

  function speak(text: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '))
    utt.lang = 'ko-KR'; utt.rate = 0.88
    const voices = window.speechSynthesis.getVoices()
    const ko = voices.find(v => v.lang.startsWith('ko'))
    if (ko) utt.voice = ko
    window.speechSynthesis.speak(utt)
  }

  const wc = WC[memoryCount % WC.length]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'linear-gradient(180deg,#FAF6EF 0%,#F5EAD8 100%)', fontFamily:"'Gowun Batang',serif" }}>

      {/* 헤더 */}
      <div style={{ background:'rgba(253,250,244,0.96)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(200,168,96,0.14)', padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={() => router.push('/')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', opacity:0.5 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'#28200F' }}>{profile?.name ? `${profile.name}님의 기억의 방` : '기억의 방'}</div>
          <div style={{ fontSize:12, color:'#9A8870', marginTop:1 }}>{new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' })}</div>
        </div>
        <button onClick={() => router.push('/book')} style={{ background:'#F0DEB8', border:'1px solid rgba(200,160,96,0.28)', borderRadius:20, padding:'7px 14px', fontSize:12, color:'#5A4A30', cursor:'pointer', fontFamily:"'Gowun Batang',serif" }}>
          📚 내 책 ({memoryCount})
        </button>
      </div>

      {/* 메시지 */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 18px', display:'flex', flexDirection:'column', gap:18 }}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, maxWidth:'90%' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#F0D4C8,#E8C0AC)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>🌸</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ background:'white', border:'1px solid rgba(200,168,96,0.15)', borderRadius:'5px 16px 16px 16px', padding:'13px 17px', fontSize:17, lineHeight:1.85, color:'#28200F', boxShadow:'0 2px 12px rgba(40,32,15,0.06)' }}>
                    {msg.content.split('\n').map((line, i, arr) => (
                      <span key={i}>{line}{i < arr.length-1 && <br/>}</span>
                    ))}
                  </div>
                  <button onClick={() => speak(msg.content)} style={{ alignSelf:'flex-start', background:'rgba(200,168,96,0.1)', border:'1px solid rgba(200,168,96,0.2)', borderRadius:20, padding:'5px 12px', fontSize:12, color:'#9A8870', cursor:'pointer', fontFamily:"'Gowun Batang',serif" }}>
                    🔊 읽어주기
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ background:'#C4826A', color:'white', borderRadius:'16px 5px 16px 16px', padding:'13px 17px', fontSize:17, lineHeight:1.8, maxWidth:'80%', boxShadow:'0 4px 16px rgba(196,130,106,0.3)' }}>
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#F0D4C8,#E8C0AC)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🌸</div>
            <div style={{ background:'white', border:'1px solid rgba(200,168,96,0.15)', borderRadius:'5px 16px 16px 16px', padding:'14px 18px', display:'flex', gap:5, alignItems:'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#E8C0AC', animation:`bounce 1.2s ${i*0.18}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {pendingMemory && (
          <div style={{ background:'white', border:'1px solid rgba(200,168,96,0.18)', borderRadius:18, overflow:'hidden', boxShadow:'0 6px 24px rgba(40,32,15,0.09)' }}>
            <div style={{ height:160, background:wc.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:54, filter:'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}>{wc.emoji}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.68)', marginTop:8, letterSpacing:'0.14em' }}>수채화로 그린 기억</div>
              </div>
            </div>
            <div style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:11, color:'#C8B898', marginBottom:8 }}>{new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })}</div>
              <div style={{ fontSize:15, color:'#5A4A30', lineHeight:1.8, fontStyle:'italic' }}>{pendingMemory.quote}</div>
            </div>
            {!pendingMemory.saved ? (
              <button onClick={saveMemory} style={{ width:'100%', padding:13, background:'none', border:'none', borderTop:'1px solid rgba(200,168,96,0.12)', fontSize:13, color:'#C4826A', cursor:'pointer', fontFamily:"'Gowun Batang',serif" }}>
                📚 내 책에 담기
              </button>
            ) : (
              <div style={{ padding:13, textAlign:'center', fontSize:13, color:'#7A9878', borderTop:'1px solid rgba(200,168,96,0.12)' }}>✓ 책에 담겼어요</div>
            )}
          </div>
        )}

        <div ref={messagesEndRef}/>
      </div>

      {/* 입력 영역 */}
      <div style={{ background:'rgba(253,250,244,0.98)', borderTop:'1px solid rgba(200,168,96,0.13)', padding:'12px 16px 28px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {(['type','voice'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid', borderColor: mode===m ? '#C4826A' : 'rgba(200,168,96,0.25)', background: mode===m ? '#C4826A' : 'none', color: mode===m ? 'white' : '#9A8870', fontSize:13, cursor:'pointer', fontFamily:"'Gowun Batang',serif" }}>
              {m === 'type' ? '✏️ 쓰기' : '🎙️ 말하기'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          {mode === 'type' ? (
            <>
              <textarea
                ref={taRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()} }}
                placeholder="이야기를 들려주세요..."
                rows={1}
                style={{ flex:1, background:'white', border:'1.5px solid rgba(200,168,96,0.25)', borderRadius:14, padding:'12px 16px', fontSize:17, fontFamily:"'Gowun Batang',serif", color:'#28200F', resize:'none', minHeight:48, maxHeight:120, lineHeight:1.65, outline:'none' }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim()||isTyping} style={{ width:48, height:48, borderRadius:'50%', background:'#C4826A', border:'none', cursor:'pointer', fontSize:18, color:'white', flexShrink:0, boxShadow:'0 4px 16px rgba(196,130,106,0.36)' }}>→</button>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'8px 0' }}>
              <button
                onClick={() => voiceStatus === 'recording' ? stopRecording() : startRecording()}
                style={{ width:64, height:64, borderRadius:'50%', background: voiceStatus==='recording' ? '#C4826A' : 'white', border:'1.5px solid', borderColor: voiceStatus==='recording' ? '#C4826A' : 'rgba(196,130,106,0.3)', cursor:'pointer', fontSize:26, boxShadow: voiceStatus==='recording' ? '0 0 0 8px rgba(196,130,106,0.15)' : '0 2px 10px rgba(40,32,15,0.08)' }}
              >
                {voiceStatus === 'recording' ? '⏹️' : voiceStatus === 'transcribing' ? '⏳' : '🎙️'}
              </button>
              <div style={{ fontSize:13, color:'#C8B898' }}>
                {voiceStatus === 'recording' ? '녹음 중... 다시 누르면 완료' : voiceStatus === 'transcribing' ? '글로 옮기는 중이에요...' : interimText || '버튼을 눌러 말씀하세요'}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:scale(1);opacity:0.45} 30%{transform:scale(1.4);opacity:1} }
      `}</style>
    </div>
  )
}