const express = require('express');
const router = express.Router();
const mikrotikController = require('../Controllers/mikrotikController');

router.get('/interfaces', mikrotikController.getInterfaces);
router.get('/traffic/:interface', mikrotikController.getTraffic);
router.get('/latency', mikrotikController.getLatency);

module.exports = router;
