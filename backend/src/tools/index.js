/**
 * tools/index.js
 *
 * Central Registry và OpenAI Function Calling Schemas cho các Deterministic Tools.
 */

import { verifyVectorAlgebra } from './tool_verify_vector_algebra.js';
import { queryMisconceptionKB } from './tool_query_misconception_kb.js';
import { checkTimelineCollision } from './tool_timeline_collision_checker.js';
import { evaluateBloomLevel } from './tool_evaluate_bloom_level.js';
import { calculateDotProduct } from './tool_calculate_dot_product.js';

export const TOOLS_REGISTRY = {
  tool_verify_vector_algebra: verifyVectorAlgebra,
  tool_query_misconception_kb: queryMisconceptionKB,
  tool_timeline_collision_checker: checkTimelineCollision,
  tool_evaluate_bloom_level: evaluateBloomLevel,
  tool_calculate_dot_product: calculateDotProduct,
};

/**
 * Định nghĩa chuẩn OpenAI Tools (JSON Schema) cho Agent Runtime
 */
export const OPENAI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'tool_verify_vector_algebra',
      description: 'Kiểm tra tính đúng đắn của phép toán hoặc độ dài vectơ trong hình học không gian (hình lập phương, hình hộp). Hỗ trợ cả cạnh tham số a hoặc số cụ thể (side = 2). Có thể tính toán giá trị độ dài khi không có claim.',
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
            description: 'Độ dài cạnh (mặc định: "a" hoặc số cụ thể như "2")',
          },
          expr: {
            type: 'string',
            description: 'Biểu thức vectơ cần tính, ví dụ: "|BC + DD\'|", "AB + AD + AA\'"',
          },
          claim: {
            type: 'string',
            description: 'Phát biểu hoặc độ dài cần kiểm chứng (tùy chọn), ví dụ: "2a", "a\\sqrt{2}", "2\\sqrt{2}"',
          },
        },
        required: ['expr'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'tool_calculate_dot_product',
      description: 'Tính toán chính xác tích vô hướng của hai vectơ u . v = |u||v|cos(theta) hoặc góc giữa hai vectơ, kiểm tra tính âm/dương hoặc trường hợp vectơ không.',
      parameters: {
        type: 'object',
        properties: {
          uMag: {
            type: 'number',
            description: 'Độ dài vectơ u',
          },
          vMag: {
            type: 'number',
            description: 'Độ dài vectơ v',
          },
          angleDeg: {
            type: 'number',
            description: 'Góc giữa hai vectơ tính bằng độ (°), ví dụ: 60, 90, 120',
          },
          claimValue: {
            type: 'string',
            description: 'Phát biểu cần kiểm chứng về giá trị tích vô hướng hoặc góc',
          },
          claimType: {
            type: 'string',
            enum: ['dot_product', 'angle'],
            description: 'Loại phát biểu: dot_product (tích vô hướng) hoặc angle (góc)',
          },
        },
        required: ['uMag', 'vMag'],
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
];

/**
 * Thực thi một Tool bất kỳ theo tên và trả về đúng hợp đồng DeterministicToolCall
 */
export function executeTool(toolName, inputArgs = {}) {
  const toolFn = TOOLS_REGISTRY[toolName];
  if (!toolFn) {
    throw new Error(`Tool "${toolName}" không tồn tại trong hệ thống Deterministic Tools.`);
  }

  const timestampMs = Date.now();
  try {
    const rawOutput = toolFn(inputArgs);
    const isValid = Boolean(rawOutput && rawOutput.isValid !== false);

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
