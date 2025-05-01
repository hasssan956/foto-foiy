const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

app.post('/submit-order', (req, res) => {
  const orderData = req.body;
  console.log('Received order:', orderData);
  // For now, just echo back a success message
  res.json({ success: true, orderId: Math.floor(Math.random() * 100000) });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});