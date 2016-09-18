import db from '../../db';
import _, { head, tail } from 'lodash';
import * as scatter from './scatter';

const router = require('express').Router({
  mergeParams: true,
});

router.get('/', (req, res) => {
  res.json({
    'scatter': {
      'doc': 'x, y, z',
    },
  })
})

router.route('/scatter')
  .get(scatter.get)
  .post(scatter.post);

export default router;
