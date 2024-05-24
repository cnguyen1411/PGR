const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { page: 'home', user: req.session.user });
});

module.exports = router;
