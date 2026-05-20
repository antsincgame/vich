import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppStore'
import { useI18n } from '../i18n/I18nContext'
import { P2P, type P2PMessage } from '../lib/p2p'
import { Badge, Button, Card, inputClass, Section } from '../components/ui'
import { uid } from '../lib/storage'
import type { Candidate, SimResult } from '../lib/types'

interface ChatItem {
  from: string
  text: string
  mine?: boolean
}

export default function Collaborate() {
  const { data, update } = useApp()
  const { t } = useI18n()
  const p2pRef = useRef<P2P | null>(null)

  const [online, setOnline] = useState(false)
  const [myId, setMyId] = useState('')
  const [peers, setPeers] = useState<string[]>([])
  const [peerInput, setPeerInput] = useState('')
  const [chat, setChat] = useState<ChatItem[]>([])
  const [chatInput, setChatInput] = useState('')
  const [recvCands, setRecvCands] = useState<Candidate[]>([])
  const [recvSims, setRecvSims] = useState<SimResult[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    return () => p2pRef.current?.stop()
  }, [])

  function wire(p: P2P) {
    p.onStatus = setOnline
    p.onPeers = setPeers
    p.onError = setError
    p.onMessage = (msg: P2PMessage, from: string) => {
      if (msg.kind === 'chat') setChat((c) => [...c, { from, text: String(msg.payload) }])
      else if (msg.kind === 'candidates') setRecvCands(msg.payload as Candidate[])
      else if (msg.kind === 'sims') setRecvSims(msg.payload as SimResult[])
    }
  }

  async function goOnline() {
    setError('')
    const p = new P2P()
    wire(p)
    p2pRef.current = p
    try {
      setMyId(await p.start())
    } catch {
      /* error surfaced via onError */
    }
  }

  function goOffline() {
    p2pRef.current?.stop()
    p2pRef.current = null
    setMyId('')
    setPeers([])
  }

  function sendChat() {
    const text = chatInput.trim()
    if (!text || !p2pRef.current) return
    p2pRef.current.broadcast('chat', text)
    setChat((c) => [...c, { from: myId, text, mine: true }])
    setChatInput('')
  }

  function importCands() {
    const incoming = recvCands.map((c) => ({ ...c, id: uid() }))
    update({ candidates: [...data.candidates, ...incoming] })
    setRecvCands([])
  }
  function importSims() {
    const incoming = recvSims.map((s) => ({ ...s, id: uid() }))
    update({ simResults: [...data.simResults, ...incoming] })
    setRecvSims([])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('p2p.title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{t('p2p.intro')}</p>

      <Section title={online ? t('p2p.online') : t('p2p.offline')}>
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {!online ? (
              <Button variant="primary" onClick={goOnline}>
                {t('p2p.start')}
              </Button>
            ) : (
              <Button variant="subtle" onClick={goOffline}>
                {t('p2p.stop')}
              </Button>
            )}
            {myId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">{t('p2p.yourId')}:</span>
                <code className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{myId}</code>
                <button
                  className="text-xs text-brand-600 hover:underline"
                  onClick={() => {
                    navigator.clipboard?.writeText(myId)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            )}
          </div>

          {online && (
            <div className="flex flex-wrap items-end gap-2">
              <input
                className={`${inputClass} max-w-xs`}
                placeholder={t('p2p.peerId')}
                value={peerInput}
                onChange={(e) => setPeerInput(e.target.value)}
              />
              <Button
                variant="subtle"
                onClick={() => {
                  p2pRef.current?.connect(peerInput)
                  setPeerInput('')
                }}
              >
                {t('p2p.connect')}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">{t('p2p.peers')}:</span>
            {peers.length === 0 ? (
              <span className="text-slate-400">{t('common.none')}</span>
            ) : (
              peers.map((p) => (
                <Badge key={p} tone="good">
                  {p}
                </Badge>
              ))
            )}
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <p className="text-xs text-slate-400">{t('p2p.note')}</p>
        </Card>
      </Section>

      {online && peers.length > 0 && (
        <Section>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="subtle"
              onClick={() => p2pRef.current?.broadcast('candidates', data.candidates)}
            >
              {t('p2p.shareCand')} ({data.candidates.length})
            </Button>
            <Button
              variant="subtle"
              onClick={() => p2pRef.current?.broadcast('sims', data.simResults)}
            >
              {t('p2p.shareSim')} ({data.simResults.length})
            </Button>
          </div>
        </Section>
      )}

      {(recvCands.length > 0 || recvSims.length > 0) && (
        <Section title={t('p2p.received')}>
          <Card className="space-y-2 p-4">
            {recvCands.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{t('p2p.shareCand')}: {recvCands.length}</span>
                <Button variant="primary" onClick={importCands}>
                  {t('p2p.import')}
                </Button>
              </div>
            )}
            {recvSims.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{t('p2p.shareSim')}: {recvSims.length}</span>
                <Button variant="primary" onClick={importSims}>
                  {t('p2p.import')}
                </Button>
              </div>
            )}
          </Card>
        </Section>
      )}

      <Section title={t('p2p.chat')}>
        <Card className="p-4">
          <div className="mb-2 max-h-56 space-y-1 overflow-auto text-sm">
            {chat.length === 0 ? (
              <p className="text-slate-400">{t('common.none')}</p>
            ) : (
              chat.map((c, i) => (
                <div key={i} className={c.mine ? 'text-right' : 'text-left'}>
                  <span className="text-xs text-slate-400">{c.mine ? '→' : c.from}: </span>
                  <span>{c.text}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder={t('p2p.msgPlaceholder')}
              value={chatInput}
              disabled={!online}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendChat()
              }}
            />
            <Button variant="primary" onClick={sendChat} disabled={!online || !chatInput.trim()}>
              {t('ai.send')}
            </Button>
          </div>
        </Card>
      </Section>
    </div>
  )
}
