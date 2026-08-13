const express = require('express');
const authenticate = require('../middleware/authenticate');
const exerciseController = require('../controllers/exerciseController');
 
const router = express.Router();
 
// Exercise data isn't sensitive, but requiring auth keeps this consistent
// with the rest of the API and avoids an unauthenticated endpoint that
// could be scraped for the whole exercise library one batch at a time.
router.get('/', authenticate, exerciseController.getExercisesByIds);
 
module.exports = router;
 