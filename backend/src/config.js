import 'dotenv/config';

const defaultModel = process.env.OPENAI_MODEL || 'gpt-6-sol';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  models: {
    bo: process.env.BO_MODEL || defaultModel,
    assessor: process.env.ASSESSOR_MODEL || defaultModel,
    coLam: process.env.COLAM_MODEL || process.env.OPENAI_MODEL || 'gpt-6.1-sol',
  },
  port: Number(process.env.PORT) || 3001,
};

if (!config.openaiApiKey) {
  console.warn(
    '[CẢNH BÁO] Chưa thấy OPENAI_API_KEY trong .env — server sẽ lỗi khi gọi thật tới OpenAI.'
  );
}
