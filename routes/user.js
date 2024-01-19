const express = require("express");
const router = express.Router();

const userCtrl = require("../controllers/user");

router.post("/signup", userCtrl.signup); // ok
router.post("/login", userCtrl.login); // ok

module.exports = router;
