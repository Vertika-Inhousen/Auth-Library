const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
