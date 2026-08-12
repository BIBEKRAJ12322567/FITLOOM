const config = require('../../config/env');
const openaiClient = require('./openaiClient');
const geminiClient = require('./geminiClient');

/**
 * The rest of the app only ever imports this file, never the provider
 * clients directly — switching AI_PROVIDER in .env is the entire migration.
 */
function generateJSON(args) {
  if (config.ai.provider === 'gemini') {
    return geminiClient.generateJSON(args);
  }
  return openaiClient.generateJSON(args);
}

module.exports = { generateJSON };
