const config = require('../../config/env');
const AppError = require('../../utils/AppError');

/**
 * Calls OpenAI's chat completions endpoint with response_format: json_object
 * so the model is constrained to return valid JSON. Node 18+ has global
 * fetch, so no extra HTTP dependency is needed.
 */
async function generateJSON({ system, user }) {
  if (!config.ai.openaiApiKey) {
    throw new AppError(
      'OPENAI_API_KEY is not configured on the server',
      500,
      'AI_PROVIDER_NOT_CONFIGURED'
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ai.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.ai.openaiModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AppError(
      `OpenAI request failed (${response.status}): ${body.slice(0, 200)}`,
      502,
      'AI_PROVIDER_ERROR'
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError('AI provider returned an empty response', 502, 'AI_EMPTY_RESPONSE');
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new AppError('AI provider returned malformed JSON', 502, 'AI_MALFORMED_RESPONSE');
  }
}

module.exports = { generateJSON };
