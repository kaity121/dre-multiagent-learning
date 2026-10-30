/**
 * tools/index.js
 *
 * Central Registry và OpenAI Function Calling Schemas cho các Deterministic Tools.
 * Đảm bảo mọi lượt gọi trả về đúng hợp đồng DeterministicToolCall (src/types/pipeline.ts):
 *
 * export interface DeterministicToolCall {
 *   toolName: 'tool_verify_vector_algebra' | 'tool_query_misconception_kb' | 'tool_timeline_collision_checker' | 'tool_evaluate_bloom_level';
 *   input: Record<string, any>;
 *   output: Record<string, any>;
 *   isValid: boolean;
 *   timestampMs: number;
 * }
 */

import { verifyVectorAlgebra } from './tool_verify_vector_algebra.js';
import { queryMisconceptionKB } from './tool_query_misconception_kb.js';
import { checkTimelineCollision } from './tool_timeline_collision_checker.js';
import { evaluateBloomLevel } from './tool_evaluate_bloom_level.js';
import { checkSourceGrounding } from './tool_check_source_grounding.js';

export const TOOLS_REGISTRY = {
  tool_verify_vector_algebra: verifyVectorAlgebra,
  tool_query_misconception_kb: queryMisconceptionKB,
  tool_timeline_collision_checker: checkTimelineCollision,
  tool_evaluate_bloom_level: evaluateBloomLevel,
  tool_check_source_grounding: checkSourceGrounding,
};

/**
 * Định nghĩa chuẩn OpenAI Tools (JSON Schema) cho Agent Runtime
 */
export const OPENAI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'tool_verify_vector_algebra',
      description: 'Kiểm tra tính đúng đắn của phép toán hoặc độ dài vectơ trong hình học không gian (hình lập phương, hình hộp). Dùng để phát hiện bẫy ngộ nhận hoặc kiểm chứng câu trả lời.',
      parameters: {
        type: 'object',
        properties: {
          shape: {
            type: 'string',
            description: 'Hình học không gian (mặc định: "cube")',
            enum: ['cube', 'cuboid', 'general_3d'],
          },
          side: {
            type: 'string',
            description: 'Độ dài cạnh (mặc định: "a")',
          },
          expr: {
            type: 'string',
            description: 'Biểu thức vectơ cần tính, ví dụ: "|BC + DD\'|", "AB + AD + AA\'"',
          },
          claim: {
            type: 'string',
            description: 'Phát biểu hoặc độ dài cần kiểm chứng, ví dụ: "2a", "a\\sqrt{2}"',
          },
        },
        required: ['expr', 'claim'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tool_query_misconception_kb',
      description: 'Tra cứu kho tri thức sư phạm (Knowledge Base) về các bẫy ngộ nhận hình học vectơ, phản ví dụ chuẩn và câu hỏi gợi mở (scaffolding).',
      parameters: {
        type: 'object',
        properties: {
          latex: {
            type: 'string',
            description: 'Biểu thức LaTeX liên quan đến ngộ nhận, ví dụ: "|\\vec{BC}+\\vec{DD\'}|"',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Các thẻ phân loại ngộ nhận, ví dụ: ["length_addition", "cube"]',
          },
          query: {
            type: 'string',
            description: 'Từ khóa tìm kiếm tự do, ví dụ: "cộng độ dài vectơ", "ví dụ 3"',
          },
          misconceptionId: {
            type: 'string',
            description: 'Mã định danh ngộ nhận cụ thể nếu biết, ví dụ: "MISC_VEC_005"',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tool_timeline_collision_checker',
      description: 'Kiểm tra nhịp thời gian trên dòng bài giảng (Timeline). Đảm bảo khoảng cách giữa 2 can thiệp >= 20s và không chèn vào đoạn mở đầu bài giảng.',
      parameters: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                at_s: { type: 'number', description: 'Thời điểm xảy ra sự kiện tính bằng giây' },
                actor_id: { type: 'string' },
                type: { type: 'string', enum: ['comment', 'checkpoint', 'rebuttal'] },
              },
              required: ['at_s'],
            },
            description: 'Danh sách các sự kiện tương tác trên timeline',
          },
          minGapS: {
            type: 'number',
            description: 'Khoảng cách tối thiểu giữa 2 sự kiện (mặc định: 20s)',
          },
        },
        required: ['events'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tool_evaluate_bloom_level',
      description: 'Đánh giá mức độ nhận thức theo Thang đo Bloom (Remember, Understand, Apply, Analyze, Evaluate, Create) cho câu hỏi hoặc nhiệm vụ của bài học.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'Nội dung câu hỏi hoặc yêu cầu cần thẩm định mức Bloom',
          },
          expected_points: {
            type: 'array',
            items: { type: 'string' },
            description: 'Các ý chính mong đợi học sinh giải thích hoặc trả lời',
          },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tool_check_source_grounding',
      description: 'Kiểm chứng một phát biểu (claim) dựa trên nguồn bài giảng thực tế (transcript, slide, bảng đen) của bất kỳ môn học nào. Trả về supported (isValid: true), contradicted (isValid: false), hoặc not_in_source (isValid: null) cùng trích dẫn mốc giây và câu trích nguyên văn.',
      parameters: {
        type: 'object',
        properties: {
          claim: {
            type: 'string',
            description: 'Phát biểu hoặc câu trả lời cần kiểm chứng căn cứ trong bài giảng',
          },
          lessonId: {
            type: 'string',
            description: 'Mã bài học hoặc video (ví dụ: VID_VECTO_12_TIEN, VID_AI_INTRO_01)',
          },
          aroundSecond: {
            type: 'number',
            description: 'Mốc thời gian (giây) đang xem để ưu tiên các đoạn bài giảng lân cận',
          },
          windowS: {
            type: 'number',
            description: 'Độ rộng cửa sổ thời gian (giây) tính từ aroundSecond (mặc định: 60s)',
          },
        },
        required: ['claim'],
      },
    },
  },
];

/**
 * Thực thi một Tool bất kỳ theo tên và trả về đúng hợp đồng DeterministicToolCall
 *
 * @param {string} toolName
 * @param {Object} inputArgs
 * @returns {Object} DeterministicToolCall
 */
export function executeTool(toolName, inputArgs = {}) {
  const toolFn = TOOLS_REGISTRY[toolName];
  if (!toolFn) {
    throw new Error(`Tool "${toolName}" không tồn tại trong hệ thống Deterministic Tools.`);
  }

  const timestampMs = Date.now();
  try {
    const rawOutput = toolFn(inputArgs);
    const isValid = rawOutput?.isValid ?? null;

    return {
      toolName,
      input: inputArgs,
      output: rawOutput,
      isValid,
      timestampMs,
    };
  } catch (error) {
    return {
      toolName,
      input: inputArgs,
      output: {
        isValid: false,
        error: error.message,
      },
      isValid: false,
      timestampMs,
    };
  }
}

export default {
  TOOLS_REGISTRY,
  OPENAI_TOOL_DEFINITIONS,
  executeTool,
};
