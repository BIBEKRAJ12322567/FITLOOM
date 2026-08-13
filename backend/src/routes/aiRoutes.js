const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../controllers/aiController');
const authenticate = require('../middleware/authenticate');
const { generateWorkoutValidators, generateDietPlanValidators } = require('../validators/aiValidators');
 
const router = express.Router();
 
// AI calls cost money and are slower than normal endpoints — a tighter,
// dedicated limit stops a buggy client (or an abusive one) from running up
// the OpenAI/Gemini bill via retries.
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many AI generation requests — try again later' } },
});
 
router.post(
  '/workouts/generate',
  authenticate,
  aiRateLimiter,
  generateWorkoutValidators,
  aiController.generateWorkout
);
 
router.post(
  '/diet/generate',
  authenticate,
  aiRateLimiter,
  generateDietPlanValidators,
  aiController.generateDietPlan
);
 
module.exports = router;
 