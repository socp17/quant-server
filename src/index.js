import express from 'express';
import api from './api';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.API_PORT
  || process.env.PORT
  || 3000;

app.use(bodyParser.json()); // for parsing application/json
app.use(function jsonApiMiddleware(req, res, next) {
  const oldJson = res.json.bind(res);
  res.errjson = oldJson;
  res.json = (body) => oldJson({
    ok: true,
    result: body,
    error: null,
  });

  next();
})

app.use(function setCorsHeaders(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
})

app.use('/api', api);

app.use(function globalErrorHandler(err, req, res, next) {
  console.error(err && err.stack);
  res.status(500)
  res.errjson({
    ok: false,
    error: err.message,
    result: null,
  });
});

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`);
});
