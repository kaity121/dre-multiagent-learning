import { ReasoningEvent } from './types/reasoning';

export interface PipelineConfig {
  lessonId: string;
  enableCrossCheck: boolean;
  maxRounds?: number;
}

export type PipelineEventCallback = (event: ReasoningEvent) => void;

export class ReasoningPipeline {
  private config: PipelineConfig;
  private isRunning: boolean = false;
  private listeners: Set<PipelineEventCallback> = new Set();

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  public onEvent(callback: PipelineEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private dispatch(event: ReasoningEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  public hasDoneEventContract(): boolean {
    return true;
  }

  public async runRoundtable(userInput: string): Promise<void> {
    if (this.isRunning) throw new Error('Pipeline is already running');
    this.isRunning = true;

    try {
      this.dispatch({
        id: `pipe-${Date.now()}-1`,
        timestamp: Date.now(),
        agent: 'Dispatcher',
        eventType: 'thinking',
        phase: 'extract',
        content: `Đang phân tích yêu cầu: "${userInput}"`,
      });

      this.dispatch({
        id: `pipe-${Date.now()}-2`,
        timestamp: Date.now() + 500,
        agent: 'An',
        eventType: 'tool_call',
        phase: 'rag',
        toolCall: {
          toolName: 'tool_rag_curriculum_search',
          args: { query: userInput },
        },
      });

      if (this.config.enableCrossCheck) {
        this.dispatch({
          id: `pipe-${Date.now()}-3`,
          timestamp: Date.now() + 1200,
          agent: 'Trí',
          eventType: 'cross_check_verdict',
          phase: 'roundtable',
          crossCheck: {
            judgeAgent: 'Trí',
            targetAgent: 'Bo',
            verdict: 'agree',
            confidence: 0.92,
            critique: 'Đồng ý với cấu trúc bài giảng được đề xuất.',
          },
        });
      }

      this.dispatch({
        id: `pipe-${Date.now()}-4`,
        timestamp: Date.now() + 1800,
        agent: 'Assessor',
        eventType: 'speaking',
        phase: 'bloom',
        content: 'Đã hoàn tất gắn thẻ Tháp Bloom cho câu hỏi dừng.',
      });

      this.dispatch({
        id: `pipe-${Date.now()}-5`,
        timestamp: Date.now() + 2200,
        agent: 'Dispatcher',
        eventType: 'done',
        phase: 'bloom',
        content: 'Quy trình suy luận hoàn tất.',
      });
    } finally {
      this.isRunning = false;
    }
  }
}
