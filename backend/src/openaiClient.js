import OpenAI from 'openai';
import { config } from './config.js';
import { executeTool, OPENAI_TOOL_DEFINITIONS } from './tools/index.js';

let client = null;

/** True when an OpenAI key is configured, so callers can choose a deterministic fallback up front. */
export function isLLMConfigured() {
  return Boolean(config.openaiApiKey);
}

/**
 * The SDK throws at construction when no key is set, so the client is built on first use.
 * Importing this module (tests, offline demo paths) therefore never requires a key.
 */
function getClient() {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY chưa được cấu hình — không thể gọi model.');
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}

/**
 * Gọi Chat Completions với response_format ép JSON, trả về object đã parse.
 * Mọi agent (Bo, Cô Lam, Assessor) đều đi qua hàm này — chỉ khác model + prompt + payload.
 *
 * @param {Object} params
 * @param {string} params.model - tên model (lấy từ config.models.*)
 * @param {string} params.systemPrompt - system prompt định nghĩa persona/nhiệm vụ
 * @param {Object} params.userPayload - dữ liệu ngữ cảnh, sẽ được JSON.stringify làm user message
 * @param {number} [params.temperature=0.7]
 * @returns {Promise<Object>} object JSON đã parse từ model
 */
export async function chatJSON({ model, systemPrompt, userPayload, temperature = 0.7 }) {
  const requestBody = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPayload) },
    ],
  };

  // Only pass custom temperature if the model supports it (gpt-6 / reasoning models require default or omit)
  if (!model.startsWith('gpt-6') && !model.startsWith('o1') && !model.startsWith('o3')) {
    requestBody.temperature = temperature;
  } else if (config.chatReasoningEffort) {
    // Reasoning models default to a slow effort; live classroom turns can opt into a faster one.
    requestBody.reasoning_effort = config.chatReasoningEffort;
  }

  const response = await getClient().chat.completions.create(requestBody);
  const raw = response.choices?.[0]?.message?.content ?? '{}';

  return parseJSONSafe(raw, model);
}

/**
 * Gọi Chat Completions có hỗ trợ Native Function Calling (Tools).
 * Cho phép Agent gọi các Deterministic Tools để kiểm chứng sự thật toán học,
 * sau đó tự điều chỉnh lời thoại dựa trên kết quả trả về từ tool.
 *
 * @param {Object} params
 * @param {string} params.model
 * @param {string} params.systemPrompt
 * @param {Object} params.userPayload
 * @param {Array} [params.tools] - Danh sách tool definitions (mặc định lấy OPENAI_TOOL_DEFINITIONS)
 * @param {string|Object} [params.tool_choice='auto']
 * @param {number} [params.maxSteps=3]
 * @returns {Promise<{ result: Object, toolCalls: Array, rawDialogue: string }>}
 */
export async function chatWithTools({
  model,
  systemPrompt,
  userPayload,
  tools = OPENAI_TOOL_DEFINITIONS,
  tool_choice = 'auto',
  temperature = 0.7,
  maxSteps = 3,
}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: JSON.stringify(userPayload) },
  ];

  const executedToolCalls = [];
  let currentToolChoice = tool_choice;

  for (let step = 0; step < maxSteps; step++) {
    const requestBody = {
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? currentToolChoice : undefined,
    };

    if (model.startsWith('gpt-6-sol')) {
      // gpt-6-sol yêu cầu reasoning_effort 'none' khi dùng tools trong chat.completions
      requestBody.reasoning_effort = 'none';
    } else if (!model.startsWith('gpt-6') && !model.startsWith('o1') && !model.startsWith('o3')) {
      requestBody.temperature = temperature;
    }

    const response = await getClient().chat.completions.create(requestBody);
    const choice = response.choices?.[0];
    const message = choice?.message;

    if (!message) {
      throw new Error(`Không nhận được phản hồi từ model ${model}`);
    }

    // 1. Kiểm tra xem model có yêu cầu gọi Tool không
    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message); // Đẩy message của assistant vào lịch sử

      for (const call of message.tool_calls) {
        const toolName = call.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(call.function.arguments || '{}');
        } catch {
          toolArgs = {};
        }

        console.log(`[Tool Call] Agent kích hoạt tool: ${toolName}`, toolArgs);

        // Thực thi tool thuần túy
        const deterministicResult = executeTool(toolName, toolArgs);
        executedToolCalls.push(deterministicResult);

        // Gửi kết quả tool lại cho model
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(deterministicResult.output),
        });
      }
      // Sau khi tool đã chạy xong, chuyển tool_choice thành 'none' để model tổng hợp phát ngôn cuối
      currentToolChoice = 'none';
      continue;
    }

    // 2. Model đã hoàn thành phát ngôn sau khi nhận kết quả tool
    const rawContent = message.content ?? '{}';
    const parsed = parseJSONSafe(rawContent, model);

    return {
      result: parsed,
      toolCalls: executedToolCalls,
      rawContent,
    };
  }

  throw new Error(`Đã vượt quá số lượt gọi tool tối đa (${maxSteps})`);
}

function parseJSONSafe(raw, model = '') {
  try {
    return JSON.parse(raw);
  } catch (err) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // rơi xuống throw bên dưới
      }
    }
    throw new Error(`Không parse được JSON từ model "${model}". Raw output: ${raw}`);
  }
}

export default {
  chatJSON,
  chatWithTools,
  isLLMConfigured,
};
