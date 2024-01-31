const Book = require("../models/book");
const fs = require("fs");

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

    if (!book) {
      return res.status(404).json({ error: "Le livre n'a pas pu être trouvé" });
    }

    const bookWithResizedImage = {
      ...book.toJSON(),
      imageUrl: book.imageUrl.replace("/images/", "/images/resized_"),
    };

    res.status(200).json(bookWithResizedImage);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ error: "Le livre n'a pas été trouvé" });
    }

    if (book.userId !== req.auth.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    const filename = book.imageUrl.split("/images/")[1];
    const resizedFilename = `resized_${filename}`;

    // Supprimer l'image importée par l'utilisateur
    fs.unlink(`images/${filename}`, (err) => {
      if (err) {
        console.error(
          "Erreur lors de la suppression de l'image importée :",
          err
        );
      }
    });

    // Supprimer l'image redimensionnée
    fs.unlink(`images/${resizedFilename}`, (err) => {
      if (err) {
        console.error(
          "Erreur lors de la suppression de l'image redimensionnée :",
          err
        );
      }
    });

    // Supprimer le livre de la base de données
    await Book.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: "Livre supprimé !" });
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    const booksWithResizedImages = books.map((book) => {
      return {
        ...book.toJSON(),
        imageUrl: book.imageUrl.replace("/images/", "/images/resized_"),
      };
    });
    res.status(200).json(booksWithResizedImages);
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
    const topRatedBooksWithResizedImages = topRatedBooks.map((book) => {
      return {
        ...book.toJSON(),
        imageUrl: book.imageUrl.replace("/images/", "/images/resized_"),
      };
    });
    res.status(200).json(topRatedBooksWithResizedImages);
  } catch (error) {
    handleServerError(res, error);
  }
};
