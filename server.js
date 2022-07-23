// required
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");
const apiRoutes = require("./routes/api.js");

const PORT = process.env.PORT || 8000;

// initialize express
const app = express();

app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// initialize mongoose
const mongoDbUri = process.env.MONGODB_URI || "mongodb://localhost/budget-tracker";
mongoose.connect(mongoDbUri, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});


// routes
app.use(apiRoutes);

// log port start
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});