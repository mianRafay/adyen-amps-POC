const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const model = require("./models");
const cors = require("cors");
// init app
const app = express();
// setup request logging
app.use(morgan("dev"));
// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Serve client from build folder
app.use(express.static(path.join(__dirname, "build")));
app.use(cors());
// enables environment variables by
// parsing the .env file and assigning it to process.env
dotenv.config({
  path: "./.env",
});

app.use(require("./routes"));
/* ################# end CLIENT ENDPOINTS ###################### */

// Start server
const PORT = process.env.PORT || 8500;
model.sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
});
