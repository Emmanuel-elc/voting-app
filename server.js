const express = require('express');
const app = express();

const pollsRoute = require('./routes/polls'); 

app.use(express.json());
app.use('/polls', pollsRoute); // 

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
