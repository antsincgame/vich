import { Peer } from 'peerjs'
import type { DataConnection } from 'peerjs'

export type P2PKind = 'hello' | 'chat' | 'candidates' | 'sims'

export interface P2PMessage {
  kind: P2PKind
  payload: unknown
  from?: string
  at?: string
}

function randomId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `hivlab-${s}`
}

/**
 * Minimal WebRTC mesh over PeerJS. The public PeerJS broker is used only for
 * signalling (exchanging connection info); the actual data flows directly
 * between browsers.
 */
export class P2P {
  private peer: Peer | null = null
  private conns = new Map<string, DataConnection>()
  id = ''

  onMessage: (msg: P2PMessage, from: string) => void = () => {}
  onPeers: (ids: string[]) => void = () => {}
  onStatus: (online: boolean) => void = () => {}
  onError: (message: string) => void = () => {}

  start(): Promise<string> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(randomId())
      this.peer = peer
      peer.on('open', (id: string) => {
        this.id = id
        this.onStatus(true)
        resolve(id)
      })
      peer.on('connection', (conn: DataConnection) => this.register(conn))
      peer.on('disconnected', () => this.onStatus(false))
      peer.on('error', (err: Error) => {
        this.onError(err.message)
        reject(err)
      })
    })
  }

  connect(peerId: string) {
    const id = peerId.trim()
    if (!this.peer || !id) return
    this.register(this.peer.connect(id, { reliable: true }))
  }

  private register(conn: DataConnection) {
    conn.on('open', () => {
      this.conns.set(conn.peer, conn)
      this.emitPeers()
      conn.send({ kind: 'hello', payload: null, from: this.id, at: new Date().toISOString() })
    })
    conn.on('data', (data: unknown) => this.onMessage(data as P2PMessage, conn.peer))
    conn.on('close', () => {
      this.conns.delete(conn.peer)
      this.emitPeers()
    })
    conn.on('error', () => {
      this.conns.delete(conn.peer)
      this.emitPeers()
    })
  }

  broadcast(kind: P2PKind, payload: unknown) {
    const msg: P2PMessage = { kind, payload, from: this.id, at: new Date().toISOString() }
    for (const conn of this.conns.values()) if (conn.open) conn.send(msg)
  }

  peers(): string[] {
    return [...this.conns.keys()]
  }

  private emitPeers() {
    this.onPeers(this.peers())
  }

  stop() {
    this.conns.forEach((c) => c.close())
    this.conns.clear()
    this.peer?.destroy()
    this.peer = null
    this.id = ''
    this.onStatus(false)
    this.emitPeers()
  }
}
