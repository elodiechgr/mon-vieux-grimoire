const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const bookCtrl = require("../controllers/book");

router.post("/", auth, multer, bookCtrl.createBook);
router.get("/:id", bookCtrl.getOneBook); // ok
router.put("/:id", auth, multer, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.get("/", bookCtrl.getAllBooks); // ok
router.post("/:id/rating", auth, bookCtrl.addBookRating);
router.get("/bestrating", bookCtrl.getTopRatedBooks);

module.exports = router;
