const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const bookCtrl = require("../controllers/book");

router.post("/", auth, multer, bookCtrl.createBook);
router.get("/:id", auth, bookCtrl.getOneBook);
router.put("/:id", auth, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.get("/", auth, bookCtrl.getAllBooks);
router.post("/:id/rating", auth, bookCtrl.addBookRating);
router.get("/bestrating", auth, bookCtrl.getTopRatedBooks);

module.exports = router;
