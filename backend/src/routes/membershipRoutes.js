const express = require('express');
const authenticate = require('../middleware/authenticate');
const membershipController = require('../controllers/membershipController');

const router = express.Router();

router.post('/:membershipId/renew', authenticate, membershipController.renewMembership);

module.exports = router;