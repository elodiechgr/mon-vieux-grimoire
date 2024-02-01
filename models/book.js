const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [
    {
      userId: { type: String },
      grade: { type: Number },
    },
  ],
  averageRating: { type: Number },
});

// Fonction pour calculer la moyenne des notes
bookSchema.methods.calculateAverageRating = function () {
  const totalRatings = this.ratings.length;
  const totalGrade = this.ratings.reduce((acc, curr) => acc + curr.grade, 0);
  this.averageRating = totalGrade / totalRatings;
};

module.exports = mongoose.model("Book", bookSchema);
