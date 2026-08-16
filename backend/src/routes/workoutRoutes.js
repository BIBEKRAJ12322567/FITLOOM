const express = require('express');
const authenticate = require('../middleware/authenticate');
const workoutController = require('../controllers/workoutController');
const { createLogValidators } = require('../validators/workoutValidators');

const router = express.Router();

router.get('/', authenticate, workoutController.listMyPlans);
router.post('/logs', authenticate, createLogValidators, workoutController.createLog);
router.get('/logs', authenticate, workoutController.listLogs);

module.exports = router;