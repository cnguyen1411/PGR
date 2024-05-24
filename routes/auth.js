const express = require('express');
const router = express.Router();

// Login route
router.get('/login', (req, res) => {
  res.render('login', { page: 'login' });
});

// Handle login submission
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    req.session.user = { username };
    res.redirect('/');
  } else {
    res.render('login', { page: 'login', error: 'Invalid credentials' });
  }
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
