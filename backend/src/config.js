import 'dotenv/config';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  models: {
    bo: process.env.BO_MODEL || 'gpt-4o-mini',
    assessor: process.env.ASSESSOR_MODEL || 'gpt-4o-mini',
    coLam: process.env.COLAM_MODEL || 'gpt-4o',
  },
  port: Number(process.env.PORT) || 3001,
};

if (!config.openaiApiKey) {
  console.warn(
    '[CẢNH BÁO] Chưa thấy OPENAI_API_KEY trong .env — server sẽ lỗi khi gọi thật tới OpenAI.'
  );
}
