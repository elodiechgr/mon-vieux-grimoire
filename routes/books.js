const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const { resizeImage } = require("../middleware/multer-config");

const bookCtrl = require("../controllers/book");

router.post("/", auth, multer.upload, resizeImage, bookCtrl.createBook);
router.get("/bestrating", bookCtrl.getTopRatedBooks);
router.get("/:id", bookCtrl.getOneBook);
router.put("/:id", auth, multer.upload, resizeImage, bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);
router.get("/", bookCtrl.getAllBooks);
router.post("/:id/rating", auth, bookCtrl.addBookRating);

module.exports = router;
