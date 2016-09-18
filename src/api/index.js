import graphs from './graphs';

const router = require('express').Router({
  mergeParams: true,
});

router.use('/graphs', graphs);
router.get('/', (req, res) => {
  res.json('hello world')
});

export default router;
