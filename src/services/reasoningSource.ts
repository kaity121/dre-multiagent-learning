import { ReasoningEvent } from '../types/reasoning';
import { sanitizeFixtureData } from '../utils/sanitizeKatex';

export type EventListener = (event: ReasoningEvent) => void;
export type StatusListener = (status: {
  isPlaying: boolean;
  speed: number;
  currentIndex: number;
  totalEvents: number;
  isReplay: boolean;
}) => void;

export interface ReasoningSource {
  subscribe(listener: EventListener): () => void;
  onStatusChange?(listener: StatusListener): () => void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setSpeed(speed: number): void;
  isReplay(): boolean;
  getCurrentSpeed(): number;
  getHistory(): ReasoningEvent[];
}

export class ReplaySource implements ReasoningSource {
  private events: ReasoningEvent[];
  private listeners: Set<EventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1.0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private history: ReasoningEvent[] = [];

  constructor(rawEvents: ReasoningEvent[], initialSpeed: number = 1.0) {
    this.events = sanitizeFixtureData(rawEvents);
    this.speed = initialSpeed;
  }

  public isReplay(): boolean {
    return true;
  }

  public getCurrentSpeed(): number {
    return this.speed;
  }

  public getHistory(): ReasoningEvent[] {
    return [...this.history];
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    this.history.forEach((evt) => listener(evt));
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    this.notifyStatus();
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(): void {
    const status = {
      isPlaying: this.isPlaying,
      speed: this.speed,
      currentIndex: this.currentIndex,
      totalEvents: this.events.length,
      isReplay: true,
    };
    this.statusListeners.forEach((l) => l(status));
  }

  private emitEvent(event: ReasoningEvent): void {
    this.history.push(event);
    this.listeners.forEach((listener) => listener(event));
  }

  public start(): void {
    if (this.isPlaying) return;
    this.currentIndex = 0;
    this.history = [];
    this.isPlaying = true;
    this.notifyStatus();
    this.scheduleNext();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notifyStatus();
  }

  public resume(): void {
    if (this.isPlaying) return;
    if (this.currentIndex >= this.events.length) {
      this.start();
      return;
    }
    this.isPlaying = true;
    this.notifyStatus();
    this.scheduleNext();
  }

  public stop(): void {
    this.pause();
    this.currentIndex = 0;
    this.history = [];
    this.notifyStatus();
  }

  public setSpeed(multiplier: number): void {
    if (multiplier <= 0) return;
    this.speed = multiplier;
    this.notifyStatus();
    if (this.isPlaying) {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    if (!this.isPlaying || this.currentIndex >= this.events.length) {
      this.isPlaying = false;
      this.notifyStatus();
      return;
    }

    const currentEvent = this.events[this.currentIndex];
    let delayMs = 600;

    if (this.currentIndex > 0) {
      const prevEvent = this.events[this.currentIndex - 1];
      const rawDelta = currentEvent.timestamp - prevEvent.timestamp;
      const boundedDelta = Math.min(Math.max(rawDelta, 200), 3500);
      delayMs = boundedDelta / this.speed;
    }

    this.timerId = setTimeout(() => {
      this.emitEvent(currentEvent);
      this.currentIndex++;
      this.notifyStatus();
      this.scheduleNext();
    }, delayMs);
  }
}
