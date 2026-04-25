const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
  res.send('Welcome to the AI Interview Platform API');
})

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Import Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/interview', require('./routes/interview.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
