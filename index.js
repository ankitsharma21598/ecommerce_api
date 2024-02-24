const express = require('express');
const bodyParser = require('body-parser');
const apiRoutes = require('./src/routes/apiRoutes');
const db = require('./src/models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to the database
db.connect()
  .then(() => {
    console.log('Database connected successfully!');
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Exit the application if unable to connect to the database
  });

app.use(bodyParser.json());
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
