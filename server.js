const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRouter = require('./api/api');

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`App running on port: ${PORT}`);
});

module.exports = app;
