import fs from 'fs';
import SQL from 'sql.js';
const dbfile = process.env.QUANT_DB_FILE || (__dirname + '/../../db.sqlite');

function run(stmt) {
  return db.run(stmt)
}

function exec(stmt) {
  const start = Date.now();
  console.log(`Running ${stmt}`)
  const result = db.exec(stmt)
  const end = Date.now();
  console.log(`Run time ${end - start}ms`);
  return result;
}

const writeFile = (file, buffer) => new Promise((resolve, reject) => {
  fs.writeFile(file, buffer, (err) => {
    if (err) reject(err);
    resolve();
  });
});

const queue = Promise.resolve('ok');
function save() {
  const data = db.export(dbfile)
  const buffer = new Buffer(data)
  return queue.then(() => writeFile(dbfile, buffer));
}

function load() {
  try {
    const filebuffer = fs.readFileSync(dbfile)
    return new SQL.Database(filebuffer);
  } catch (e) {
    return new SQL.Database();
  }
}

// Singleton.
const db = load();

export default {
  run,
  exec,
  save,
}
