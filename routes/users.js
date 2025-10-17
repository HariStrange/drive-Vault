const express = require('express');
const pool = require('../config/db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/admin/all-users', authenticateToken, isAdmin, async (req, res) => {
  const { role } = req.query;

  try {
    let query = 'SELECT id, email, name, phone, role, is_verified, created_at FROM users WHERE role != $1';
    const params = ['admin'];

    if (role && ['driver', 'welder', 'student'].includes(role)) {
      query += ' AND role = $2';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/admin/user/:userId', authenticateToken, isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, is_verified, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users WHERE role != $1', ['admin']);
    const drivers = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['driver']);
    const welders = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['welder']);
    const students = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['student']);
    const verified = await pool.query('SELECT COUNT(*) FROM users WHERE is_verified = true AND role != $1', ['admin']);

    res.json({
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        drivers: parseInt(drivers.rows[0].count),
        welders: parseInt(welders.rows[0].count),
        students: parseInt(students.rows[0].count),
        verifiedUsers: parseInt(verified.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
