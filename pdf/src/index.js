const app = require("./app");

const PORT = 3201;

app.listen(PORT, err => {
  if (err) throw err;
  console.log(`> Running on localhost :${PORT}`);
});
