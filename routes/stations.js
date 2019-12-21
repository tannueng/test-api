const router = require("express").Router();
const Influx = require("influx");
const verify = require("./verifyToken");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const influx = new Influx.InfluxDB({
  //Should put in .env
  host: "localhost",
  database: process.env.INFLUX_DB,
  // username: "username",
  // password: "password",
  port: 8086
});

const pool = mysql.createPool({
  host: "localhost",
  user: process.env.SQL_USERNAME,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

defaultSQLquery =
  "SELECT topic,project,id,lat,lon,name,tambol,amphoe,province,country FROM station WHERE publish = 1";

router.get("/all", (req, res) => {
  pool.query(defaultSQLquery, function(err, rows, fields) {
    // Connection is automatically released when query resolves
    let final_result = {};
    for (i = 0; i < rows.length; i++) {
      final_result[rows[i].id] = rows[i];
    }
    res.json(final_result);
  });
});
router.get("/active", (req, res) => {
  pool.query(defaultSQLquery, function(err, rows, fields) {
    // Connection is automatically released when query resolves
    influx
      .query(
        "select last(*) from airdata where time > now() - 70m group by topic"
      )
      .then(results => {
        let final_result = {};
        for (i = 0; i < rows.length; i++) {
          for (j = 0; j < results.length; j++) {
            if (rows[i].topic == results[j].topic) {
              final_result[rows[i].id] = rows[i];
              final_result[rows[i].id].info = rows[i];

              res.json(final_result);
            }
          }
        }
        res.json(final_result);
      })
      .catch(console.error);
  });
});

module.exports = router;