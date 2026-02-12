const express = require('express');
const router = express.Router();
const reputationController = require('../controllers/reputationController');
const { auth } = require('../middleware');

router.get('/reputation/:workerId', auth, reputationController.getReputation);

module.exports = router;