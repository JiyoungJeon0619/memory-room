'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 'name' | 'birth' | 'topics'

const TOPICS = [
  { key: '나의 이야기', icon: '🙋‍♀️' },
  { key: '가족 이야기', icon: '👨‍👩‍👧' },
  { key: '반려동물',   icon: '🐾' },
  { key: '고향과 추억', icon: '🏡' },
  { key: '일과 직업', icon: '🧵' },
  { key: '여행과 장소', icon: '🌏' },
  { key: '음식과 요리', icon: '🍲' },
  { key: '꿈과 바람',  icon: '🌙' },
]

const s = {
  wrap: { minHeight:'100vh', background:'linear-gradient(180deg,#FAF6EF 0%,#F5EBD8 100%)', fontFamily:"'Gowun Batang',serif", display:'flex', flexDirection:'column' as const },
  header: { padding:'20px 20px 0', display:'flex', alignItems:'center', gap:10 },
  logo: { fontSize:20 },
  logoText: { fontSize:15, fontWeight:700, color:'#5A4A30' },
  dots: { marginLeft:'auto', display:'flex', gap:5 },
  chat: { flex:1, overflowY:'auto' as const, padding:'28px 20px 16px', display:'flex', flexDirection:'column' as const, gap:18 },
  aiBubble: { display:'flex', alignItems:'flex-start', gap:10 },
  avatar: { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#F0D4C8,#E8C0AC)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 as const },
  bubble: { background:'white', border:'1px solid rgba(200,168,96,0.15)', borderRadius:'5px 18px 18px 18px', padding:'14px 18px', fontSize:16, lineHeight:1.85, color:'#28200F', boxShadow:'0 3px 14px rgba(40,32,15,0.07)' },
  userBubble: { display:'flex', justifyContent:'flex-end' as const },
  userText: { background:'#C4826A', color:'white', borderRadius:'18px 5px 18px 18px', padding:'14px 18px', fontSize:16, lineHeight:1.8, maxWidth:'80%', boxShadow:'0 4px 18px rgba(196,130,106,0.32)' },
  inputArea: { padding:'12px 16px 28px', background:'rgba(250,246,239,0.98)', borderTop:'1px solid rgba(200,168,96,0.12)' },
  input: { width:'100%', background:'white', border:'1.5px solid rgba(200,168,96,0.25)', borderRadius:14, padding:'13px 16px', fontSize:16, fontFamily:"'Gowun Batang',serif", color:'#28200F', outline:'none', boxSizing:'border-box' as const },
  sendBtn: { width:48, height:48, borderRadius:'50%', background:'#C4826A', border:'none', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', flexShrink:0 as const, boxShadow:'0 4px 16px rgba(196,130,106,0.36)', color:'white' },
  topicGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:4 },
  topicCard: (selected: boolean) => ({ background:'white', border:`2px solid ${selected ? '#C4826A' : 'rgba(200,168,96,0.2)'}`, borderRadius:16, padding:'16px 12px', textAlign:'center' as const, cursor:'pointer', position:'relative' as const, boxShadow: selected ? '0 4px 16px rgba(196,130,106,0.2)' : 'none' }),
  confirmBtn: { width:'100%', padding:15, background:'#C4826A', color:'white', border:'none', borderRadius:14, fontSize:16, fontFamily:"'Gowun Batang',serif", cursor:'pointer', marginTop:12, boxShadow:'0 6px 20px rgba(196,130,106,0.32)' },
  startBtn: { width:'100%', padding:20, background:'#C4826A', color:'white', border:'none', borderRadius:16, fontSize:18, fontFamily:"'Gowun Batang',serif", cursor:'pointer', margin:'16px 0 8px', boxShadow:'0 8px 28px rgba(196,130,106,0.38)' },
}

interface ChatMsg { role: 'ai' | 'user'; text: string }

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('name')
  const [chatLog, setChatLog] = useState<ChatMsg[]>([
    { role:'ai', text:'어서 오세요. 🌸\n\n이곳은 당신만의 이야기를 담는 조용한 방이에요.\n\n먼저, 어떻게 불러드릴까요?\n이름이나 편하신 호칭을 알려주세요.' }
  ])
  const [inputVal, setInputVal] = useState('')
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const stepIndex = step === 'name' ? 0 : step === 'birth' ? 1 : 2

  function addMsg(role: 'ai' | 'user', text: string) {
    setChatLog(prev => [...prev, { role, text }])
  }

  function handleSend() {
    const val = inputVal.trim()
    if (!val) return
    setInputVal('')
    addMsg('user', val)

    if (step === 'name') {
      setName(val)
      setTimeout(() => {
        addMsg('ai', `반갑습니다, ${val}님. 🌿\n\n몇 년생이세요?\n부담 없이 알려주시면 돼요. (예: 1952년생)`)
        setStep('birth')
      }, 600)
    } else if (step === 'birth') {
      setBirth(val)
      setTimeout(() => {
        addMsg('ai', `감사해요. 🌸\n\n이 방에서 어떤 이야기를 담고 싶으세요?\n마음에 드는 것을 골라주세요. 여러 개도 괜찮아요.`)
        setStep('topics')
      }, 600)
    }
  }

  function toggleTopic(key: string) {
    setSelectedTopics(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    )
  }

  async function handleConfirm() {
    if (selectedTopics.length === 0) return
    setSaving(true)

    const topicText = selectedTopics.join(', ')
    addMsg('user', `${topicText} 이야기를 담고 싶어요`)

    setTimeout(() => {
      addMsg('ai', `${name}님, 정말 좋아요. 💛\n\n${topicText}에 대한 이야기들을\n천천히 함께 풀어나가 볼게요.\n\n준비되셨으면 시작해볼까요?`)
      setDone(true)
      setSaving(false)
    }, 800)

    // Supabase 프로필 업데이트
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        name,
        birth_year: birth,
        topics: selectedTopics,
      }).eq('id', user.id)
    }
  }

  return (
    <div style={s.wrap}>
      {/* 헤더 */}
      <div style={s.header}>
        <span style={s.logo}>📖</span>
        <span style={s.logoText}>기억의 방</span>
        <div style={s.dots}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: i===stepIndex ? 18 : 6, height:6, borderRadius:3, background: i===stepIndex ? '#C4826A' : '#C8B898', transition:'all 0.3s' }}/>
          ))}
        </div>
      </div>

      {/* 대화 */}
      <div style={s.chat}>
        {chatLog.map((msg, i) => (
          <div key={i}>
            {msg.role === 'ai' ? (
              <div style={s.aiBubble}>
                <div style={s.avatar}>🌸</div>
                <div style={s.bubble}>
                  {msg.text.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length-1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={s.userBubble}>
                <div style={s.userText}>{msg.text}</div>
              </div>
            )}
          </div>
        ))}

        {/* 토픽 선택 */}
        {step === 'topics' && !done && (
          <div>
            <div style={s.topicGrid}>
              {TOPICS.map(t => (
                <div key={t.key} style={s.topicCard(selectedTopics.includes(t.key))} onClick={() => toggleTopic(t.key)}>
                  {selectedTopics.includes(t.key) && (
                    <div style={{ position:'absolute', top:8, right:10, fontSize:11, color:'#C4826A', fontWeight:700 }}>✓</div>
                  )}
                  <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
                  <div style={{ fontSize:14, color:'#5A4A30' }}>{t.key}</div>
                </div>
              ))}
            </div>
            {selectedTopics.length > 0 && (
              <button style={s.confirmBtn} onClick={handleConfirm} disabled={saving}>
                선택 완료 ({selectedTopics.length}개)
              </button>
            )}
          </div>
        )}

        {/* 시작 버튼 */}
        {done && (
          <button style={s.startBtn} onClick={() => router.push('/chat')}>
            이야기 시작하기 →
          </button>
        )}
      </div>

      {/* 입력창 */}
      {(step === 'name' || step === 'birth') && (
        <div style={s.inputArea}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <input
              style={s.input}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="여기에 입력하세요..."
            />
            <button style={s.sendBtn} onClick={handleSend}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}