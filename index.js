const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL config
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ipo_app',
  password: '1234', // your password
  port: 5432,
});

// Apply to IPO
app.post('/apply', async (req, res) => {
  try {
    const { user_id, ipo_id, number_of_shares } = req.body;

    const ipoResult = await pool.query('SELECT * FROM ipos WHERE ipo_id = $1', [ipo_id]);
    const ipo = ipoResult.rows[0];

    if (!ipo) return res.status(404).json({ error: 'IPO not found' });

    const today = new Date();
    const openDate = new Date(ipo.open_date);
    const closeDate = new Date(ipo.close_date);

    if (today < openDate || today > closeDate) {
      return res.status(400).json({ error: 'IPO is not open' });
    }

    await pool.query(
      `INSERT INTO applications (user_id, ipo_id, number_of_shares)
       VALUES ($1, $2, $3)`,
      [user_id, ipo_id, number_of_shares]
    );

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error("🔥 Error in /apply:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get past applications
app.get('/applications/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT a.*, i.company_name FROM applications a
      JOIN ipos i ON a.ipo_id = i.ipo_id
      WHERE a.user_id = $1
      ORDER BY a.application_date DESC
    `, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error("🔥 Error in /applications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get('/applications/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const result = await pool.query(
      `SELECT a.application_id, a.number_of_shares, a.status, a.application_date,
              i.company_name, i.price_per_share
       FROM applications a
       JOIN ipos i ON a.ipo_id = i.ipo_id
       WHERE a.user_id = $1
       ORDER BY a.application_date DESC`,
      [user_id]
    );

    res.status(200).json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
