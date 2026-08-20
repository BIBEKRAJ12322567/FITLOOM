const express = require('express');
const authenticate = require('../middleware/authenticate');
const dietController = require('../controllers/dietController');

const router = express.Router();

router.get('/', authenticate, dietController.listMyPlans);

module.exports = router;