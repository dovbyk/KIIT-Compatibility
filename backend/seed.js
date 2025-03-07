const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await Question.deleteMany({});
    await Question.insertMany([
      { text: "Favorite season?", options: ["A: Spring", "B: Summer", "C: Fall", "D: Winter"] },
      { text: "Morning or night person?", options: ["A: Morning", "B: Night"] },
      { text: "Favorite color?", options: ["A: Blue", "B: Red", "C: Green", "D: Yellow"] },
      { text: "Preferred weekend activity?", options: ["A: Movies", "B: Hiking", "C: Reading", "D: Gaming"] },
      { text: "Favorite food?", options: ["A: Pizza", "B: Sushi", "C: Burgers", "D: Pasta"] },
      { text: "Ideal vacation?", options: ["A: Beach", "B: Mountains", "C: City", "D: Countryside"] },
      { text: "Music taste?", options: ["A: Pop", "B: Rock", "C: Hip-Hop", "D: Classical"] },
      { text: "Pet preference?", options: ["A: Dog", "B: Cat", "C: Bird", "D: None"] },
      { text: "Work style?", options: ["A: Team", "B: Solo"] },
      { text: "Coffee or tea?", options: ["A: Coffee", "B: Tea"] }
    ]);
    console.log('Questions seeded');
    process.exit();
  })
  .catch(err => console.error(err));
