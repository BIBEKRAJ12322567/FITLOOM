const express = require('express');
const authenticate = require('../middleware/authenticate');
const membershipController = require('../controllers/membershipController');

const router = express.Router();

router.get('/mine', authenticate, membershipController.listMyMemberships);
router.post('/:membershipId/renew', authenticate, membershipController.renewMembership);

module.exports = router;