const express = require('express');
const router = express.Router();
const escrowController = require('../controllers/escrowController');
const { auth } = require('../middleware');

router.post('/escrow/release', auth, escrowController.releaseEscrow);
router.post('/escrow/refund', auth, escrowController.refundEscrow);

module.exports = router;