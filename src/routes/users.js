const express = require('express');
const User = require('../models/User');
const router = express.Router();
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
});

router.get('/', roleMiddleware(['admin']), async (req, res) => {
    const users = await User.find().populate('idRoles');
    res.send(users);
});

module.exports = router;