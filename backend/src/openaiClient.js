import OpenAI from 'openai';
import { config } from './config.js';

const client = new OpenAI({ apiKey: config.openaiApiKey });

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
  const response = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPayload) },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '{}';

  try {
    return JSON.parse(raw);
  } catch (err) {
    // Model đôi khi trả JSON kèm rác — thử cắt phần {...} ngoài cùng trước khi bỏ cuộc
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
