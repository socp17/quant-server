import db from '../../db';
import _, { head, tail } from 'lodash';
import moment from 'moment';

export const doc = `
  Graph type: 'scatter'
  Required props: 'x', 'y'
  Optional props: 'z', 'start', 'end'

  Arguments:
    str x: a 'table'.'column' to search for
    str y: a 'table'.'column' to search for
    str z: a 'table'.'column' to search for
    unix_time start: start of an interval over which z should be computed
    unix_time end: [default=Date.now()]

  When start is provided, the value of z will be calculated as the percent change
  of 'z' at time 'end' versus at time 'start'. Otherwise, the value of 'z' is the
  latest value of 'z' before or equal to 'end'.

  Example:
    POST /api/graphs/scatter {
      "x": "key_stats.price_to_book",
      "y": "key_stats.price_to_earnings_growth",
      "z": "price_histories.price"
    }
`

export const get = (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(doc)
}

export const post = (req, res) => {
  const { body } = req;
  const { x, y, z } = body;
  const start = body.start;
  const end = body.end || moment().endOf('day').format('x');
  console.log(start, end);
  const tables = _([x, y, z])
    .filter(x => x)
    .map(key => key.split('.')[0])
    .uniq()
    .value();

  const columns = _([x, y, z])
    .filter(x => x)
    .value().join(',\n      ');

  const joinStmt = tables.map(table => `JOIN ${table}`).join(' \n')
  const onCid = tables.map(table => `${table}.company_id = companies.id`)
    .join(' \n        AND ')
  const onDate = tables.length > 1
    ? tail(tables)
      .map((table) => `AND ${table}.date = ${head(tables)}.date`)
      .join(' \n')
    : '';

  const results = db.exec(`
    SELECT
      companies.ticker,
      ${head(tables)}.date,
      ${columns}
    FROM companies
      ${joinStmt}
      ON ${onCid}
      ${onDate}
    ORDER BY companies.ticker, ${head(tables)}.date ASC`
  );

  const cols = results[0].columns;
  const rows = results[0].values;
  let data = _.chain(rows)
    .map(row => _.zipObject(['ticker', 'date', 'x', 'y', 'z'], row))
    .filter(row => row.x !== 'N/A')
    .filter(row => row.y !== 'N/A')
    .filter(row => row.z !== 'N/A')
    .value();

  const latest = (rows, date) => _(rows)
    .filter(row => date - row.date >= 0)
    .minBy(row => date - row.date)

  if (start && end) {
    data = _(data)
      .groupBy('ticker')
      .map(rows => {
        const s = latest(rows, start) || _.first(rows)
        const e = latest(rows, end)
        return {
          ...e,
          z: (e.z - s.z) / s.z * 100,
        };
      })
      .map(row => _.omit(row, 'date'))
      .value();
  } else {
    data = _(data)
      .groupBy('ticker')
      .map(rows => latest(rows, end))
      .map(row => _.omit(row, 'date'))
      .value();
  }

  const xs = _.map(data, 'x');
  const ys = _.map(data, 'y');
  const zs = _.map(data, 'z');
  const tickers = _.map(data, 'ticker');

  throw new Error('newop')

  res.json({
    tickers,
    x: xs,
    y: ys,
    z: zs,
  })
}
