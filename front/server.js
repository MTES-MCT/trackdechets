const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const directory = "/" + (process.env.STATIC_DIR || "build");
app.use(express.static(__dirname + directory));

const pathToIndex = path.join(__dirname, directory, "index.html");

const raw = fs.readFileSync(pathToIndex, "utf8");
const indexContent =
  process.env.NO_INDEX === true
    ? raw.replace(
        '<meta name="robots" content="all" />',
        '<meta name="robots" content="noindex nofollow" />'
      )
    : raw;

app.get("/*", function (req, res) {
  res.send(indexContent);
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Trackdechets front listening on", port);
});
