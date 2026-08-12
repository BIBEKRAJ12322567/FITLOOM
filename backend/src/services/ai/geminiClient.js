const config = require('../../config/env');
const AppError = require('../../utils/AppError');

/**
 * Calls Gemini's generateContent endpoint with responseMimeType set to
 * application/json. Kept behind the same generateJSON({system, user})
 * interface as openaiClient.js so aiClient.js can swap providers by config
 * alone — no caller needs to know which provider actually ran.
 */
async function generateJSON({ system, user }) {
  if (!config.ai.geminiApiKey) {
    throw new AppError(
      'GEMINI_API_KEY is not configured on the server',
      500,
      'AI_PROVIDER_NOT_CONFIGURED'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.geminiModel}:generateContent?key=${config.ai.geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AppError(
      `Gemini request failed (${response.status}): ${body.slice(0, 200)}`,
      502,
      'AI_PROVIDER_ERROR'
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
