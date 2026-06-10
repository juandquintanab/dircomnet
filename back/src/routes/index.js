const { Router } = require('express');
const infRoutes = require('./infRoutes');
const perRoutes = require('./perRoutes');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/inf', infRoutes);
router.use('/per', perRoutes);

module.exports = router;
