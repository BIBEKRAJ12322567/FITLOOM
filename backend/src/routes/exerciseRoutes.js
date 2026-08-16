const express = require('express');
const authenticate = require('../middleware/authenticate');
const exerciseController = require('../controllers/exerciseController');

const router = express.Router();

// Exercise data isn't sensitive, but requiring auth keeps this consistent
// with the rest of the API and avoids an unauthenticated endpoint that
// could be scraped for the whole exercise library.

// /batch MUST be registered before /:id, or Express will treat "batch" as
// a literal :id value and try to look up an exercise named "batch".
router.get('/batch', authenticate, exerciseController.getExercisesByIds);
router.get('/', authenticate, exerciseController.listExercises);
router.get('/:id', authenticate, exerciseController.getExerciseById);

module.exports = router;