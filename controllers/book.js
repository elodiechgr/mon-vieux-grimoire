const Book = require("../models/book");

const handleServerError = (res, error) => {
  console.error(error);
  res
    .status(500)
    .json({ error: "Une erreur interne du serveur s'est produite" });
};

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    if (!req.file) {
      return res.status(400).json({ message: "Fichier manquant" });
    }

    delete bookObject._id;
    delete bookObject._userId;

    if (bookObject.ratings[0].grade === 0) {
      bookObject.ratings = [];
    }

    const filename = req.file.filename;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${filename}`,
    });

    await book.save();
    res.status(201).json({ message: "Livre enregistré" });
  } catch (error) {
    const filename = req.file.filename;
    fs.unlinkSync(`images/${filename}`);
    handleServerError(res, error);
  }
};

exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (book) {
      res.status(200).json(book);
    } else {
      res.status(404).json({ error: "Le livre n'a pas pu être trouvé" });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.modifyBook = async (req, res, next) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
          }`,
        }
      : { ...req.body };

    delete bookObject._userId;

    const book = await Book.findOne({ _id: req.params.id });

    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: "Requête non autorisée" });
    }

    if (req.file) {
      const filename = book.imageUrl.split("/images/")[1];
      fs.unlinkSync(`images/${filename}`);
    }

    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    res.status(200).json({ message: "Livre modifié" });
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const filename = book.imageUrl.split("/images/")[1];
    fs.unlinkSync(`images/${filename}`);

    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Livre supprimé" });
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.addBookRating = async (req, res, next) => {
  try {
    const existingRating = await Book.findOne({
      _id: req.params.id,
      "ratings.userId": req.body.userId,
    });

    if (existingRating) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    if (
      !(req.body.rating >= 0) ||
      !(req.body.rating <= 5) ||
      typeof req.body.rating !== "number"
    ) {
      return res
        .status(500)
        .json({ message: "La note doit être entre 0 et 5" });
    }

    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    book.ratings.push({ userId: req.body.userId, grade: req.body.rating });
    await book.save();

    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    handleServerError(res, error);
  }
};

exports.getTopRatedBooks = async (req, res, next) => {
  try {
    const topRatedBooks = await Book.find()
      .sort({ averageRating: -1 })
      .limit(3);
    res.status(200).json(topRatedBooks);
  } catch (error) {
    handleServerError(res, error);
  }
};
