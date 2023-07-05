const { Client } = require('pg'); // eslint-disable-line

const pgclient = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_CLIENT_PASSWORD,
  database: process.env.POSTGRES_NAME
});

pgclient.connect();

const sequence =
  'CREATE SEQUENCE id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 NO MAXVALUE CACHE 1;';
const table = 'CREATE TABLE users (id INT, username TEXT, password TEXT);';
// id INT,
// age INT,
// username TEXT,
// password TEXT,
// time_created INT,
// first_name TEXT,
// last_name TEXT,
// email TEXT
const text =
  'INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *';
const values = [
  '2',
  'testname',
  '123456abcdef'
  // '88 Colin P Kelly Jr St, San Francisco, CA 94107, United States',
  // 'octocat@github.com'
];

pgclient.query(table, (err, res) => {
  if (err) throw err;
  console.log('create table success', res.rows[0]);
});

pgclient.query(sequence, (err, res) => {
  if (err) throw err;
  console.log('create sequence success', res.rows[0]);
});

pgclient.query(text, values, (err, res) => {
  if (err) throw err;
  console.log('insert users success', res.rows[0]);
});

pgclient.query('SELECT * FROM users', (err, res) => {
  if (err) throw err;
  console.log(err, res.rows); // Print the data in student table
  pgclient.end();
});