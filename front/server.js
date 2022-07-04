const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const directory = "/" + (process.env.STATIC_DIR || "build");
app.use(express.static(__dirname + directory));

const pathToIndex = path.join(__dirname, directory, "index.html");
app.get("/*", function (req, res) {
  if (process.env.BUILD_ENV !== "production") {
    const raw = fs.readFileSync(pathToIndex, "utf8");
    const updated = raw.replace(
      '<meta name="robots" content="all" />',
      '<meta name="robots" content="noindex nofollow" />'
    );
    res.send(updated);
  } else {
    res.sendFile(pathToIndex);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Trackdechets front listening on", port);
});
