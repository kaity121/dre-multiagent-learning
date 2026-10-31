import { ReasoningEvent } from '../types/reasoning';
import { ReasoningSource, EventListener, StatusListener } from './reasoningSource';
import { sanitizeFixtureData } from '../utils/sanitizeKatex';

import { mapBackendToReasoningEvent, normalizeAgentName } from './reasoningAdapter';
import { API_BASE_URL, type RoundtableProvenance } from './dreBackendApi';

const KNOWN_PROVENANCES: ReadonlySet<string> = new Set(['live', 'replay', 'fallback_fixture']);

export interface SSEClientOptions {
  url?: string;
  videoId?: string;
  partNumber?: number;
  /** A video analysed in the War Room; the council then reads it instead of the indexed lesson. */
  clip?: string;
  streamDelayMs?: number;
  useLLM?: boolean;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
}

export class SSEReasoningSource implements ReasoningSource {
  private url: string;
  private videoId: string;
  private partNumber?: number;
  private clip?: string;
  private streamDelayMs: number;
  private useLLM: boolean;
  private autoReconnect: boolean;
  private maxReconnectAttempts: number;
  private reconnectDelayMs: number;

  private eventSource: EventSource | null = null;
  private listeners: Set<EventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private history: ReasoningEvent[] = [];
  private isConnecting: boolean = false;
  private isRunning: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private speed: number = 1.0;
  /** Set from the server's `session_start` frame; a started session is never silently re-run. */
  private provenance: RoundtableProvenance | null = null;
  private sessionStarted: boolean = false;

  constructor(options: SSEClientOptions = {}) {
    const apiBase =
      ((globalThis as any).process?.env?.REACT_APP_API_BASE_URL) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
      API_BASE_URL;

    this.url = options.url || `${apiBase}/api/roundtable/stream`;
    this.videoId = options.videoId || 'VID_VECTO_12_TIEN';
    this.partNumber = options.partNumber;
    this.clip = options.clip;
    this.streamDelayMs = options.streamDelayMs ?? 20;
    this.useLLM = options.useLLM ?? false;
    this.autoReconnect = options.autoReconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1500;
  }

  public isReplay(): boolean {
    return false;
  }

  public getProvenance(): RoundtableProvenance | null {
    return this.provenance;
  }

  public getCurrentSpeed(): number {
    return this.speed;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
    this.notifyStatus();
  }

  public getHistory(): ReasoningEvent[] {
    return [...this.history];
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    // Gửi lại lịch sử sự kiện đã nhận cho subscriber mới
    this.history.forEach((evt) => {
      try {
        listener(evt);
      } catch (err) {
        console.warn('[SSEClient] Lỗi listener:', err);
      }
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({
      isPlaying: this.isRunning,
      speed: this.speed,
      currentIndex: this.history.length,
      totalEvents: this.history.length,
      isReplay: false,
      provenance: this.provenance,
    });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.reconnectAttempts = 0;
    this.sessionStarted = false;
    this.provenance = null;
    this.connect();
  }

  public pause(): void {
    this.stopConnection();
    this.isRunning = false;
    this.notifyStatus();
  }

  public resume(): void {
    if (!this.isRunning) {
      this.start();
    }
  }

  public stop(): void {
    this.stopConnection();
    this.isRunning = false;
    this.history = [];
    this.sessionStarted = false;
    this.provenance = null;
    this.notifyStatus();
  }

  private stopConnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (err) {}
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  private buildStreamUrl(): string {
    const params = new URLSearchParams();
    params.set('videoId', this.videoId);
    if (this.partNumber !== undefined) params.set('partNumber', String(this.partNumber));
    if (this.clip) params.set('clip', this.clip);
    params.set('streamDelayMs', String(this.streamDelayMs));
    if (this.useLLM) params.set('useLLM', 'true');
    const sep = this.url.includes('?') ? '&' : '?';
    return `${this.url}${sep}${params.toString()}`;
  }

  private connect(): void {
    if (this.isConnecting || !this.isRunning) return;
    this.isConnecting = true;

    const fullUrl = this.buildStreamUrl();
    try {
      this.eventSource = new EventSource(fullUrl);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatus();
      };

      const handleEventData = (rawData: string) => {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed && typeof parsed === 'object') {
            const normalized = this.normalizeEvent(parsed);
            if (normalized) {
              this.history.push(normalized);
              this.emitEvent(normalized);
              this.notifyStatus();
            }
          }
        } catch (err) {
          console.warn('[SSEClient] Lỗi parse JSON:', err, rawData);
        }
      };

      this.eventSource.addEventListener('session_start', (e: MessageEvent) => {
        try {
          const info = JSON.parse(e.data);
          this.sessionStarted = true;
          this.provenance = KNOWN_PROVENANCES.has(info?.provenance) ? info.provenance : null;
          this.notifyStatus();
        } catch (err) {
          console.warn('[SSEClient] Lỗi parse session_start:', err);
        }
      });

      // The server also emits alias names (`reasoning`, `message`, per-eventType) for each event;
      // only the canonical `reasoning_event` is consumed so every event is delivered once.
      this.eventSource.addEventListener('reasoning_event', (e: MessageEvent) => {
        handleEventData(e.data);
      });

      this.eventSource.addEventListener('complete', (e: MessageEvent) => {
        let completePayload: any = null;
        let completeContent = 'Quá trình trích xuất và hội đồng phản biện hoàn tất.';
        if (e.data) {
          try {
            completePayload = JSON.parse(e.data);
            if (completePayload?.message || completePayload?.content) {
              completeContent = completePayload.message || completePayload.content;
            }
          } catch (_err) {
            if (typeof e.data === 'string' && e.data.trim()) {
              completeContent = e.data;
            }
          }
        }

        const doneEvt: ReasoningEvent = {
          id: completePayload?.id || `done-${Date.now()}`,
          timestamp: Date.now(),
          agent: completePayload?.agent ? normalizeAgentName(completePayload.agent) : 'Assessor',
          eventType: 'done',
          content: completeContent,
          metadata: {
            ...completePayload,
            lesson: completePayload?.lesson || completePayload?.draftLesson || completePayload?.schema,
          },
        };
        this.history.push(doneEvt);
        this.emitEvent(doneEvt);
        this.stopConnection();
        this.notifyStatus();
      });

      this.eventSource.onerror = (err) => {
        this.stopConnection();

        // A server `event: error` frame carries JSON data and is terminal; native connection errors carry none.
        const serverPayload = (err as MessageEvent).data;
        if (typeof serverPayload === 'string') {
          console.warn('[SSEClient] Máy chủ Roundtable báo lỗi:', serverPayload);
          this.isRunning = false;
          this.notifyStatus();
          return;
        }
        console.warn('[SSEClient] EventSource kết nối bị gián đoạn:', err);

        // Reconnecting after a live session started would launch a brand-new run and duplicate events,
        // so only retry while the backend has not been reached yet.
        if (this.isRunning && !this.sessionStarted && this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts += 1;
          const delay = this.reconnectDelayMs * Math.pow(1.5, this.reconnectAttempts - 1);
          this.reconnectTimer = setTimeout(() => {
            if (this.isRunning) this.connect();
          }, delay);
        } else {
          this.isRunning = false;
          this.notifyStatus();
        }
      };
    } catch (err) {
      console.warn('[SSEClient] Lỗi khởi tạo EventSource:', err);
      this.isConnecting = false;
      this.isRunning = false;
      this.notifyStatus();
    }
  }

  private normalizeEvent(raw: any): ReasoningEvent | null {
    if (!raw) return null;
    return mapBackendToReasoningEvent(raw);
  }

  private emitEvent(evt: ReasoningEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(evt);
      } catch (err) {
        console.warn('[SSEClient] Lỗi phát sự kiện:', err);
      }
    });
  }

  private notifyStatus(): void {
    const status = {
      isPlaying: this.isRunning,
      speed: this.speed,
      currentIndex: this.history.length,
      totalEvents: this.history.length,
      isReplay: false,
      provenance: this.provenance,
    };
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {}
    });
  }
}

export function createSSEClient(options: SSEClientOptions = {}): SSEReasoningSource {
  return new SSEReasoningSource(options);
}

