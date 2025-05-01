const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://photo-foiy.netlify.app'
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

const supabase = createClient(
  'https://easuceuubzkidoykxfsu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc3VjZXV1YnpraWRveWt4ZnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMTIwOTgsImV4cCI6MjA2MTY4ODA5OH0.CHpSpMCMQcWI4wefjNxLSvTDepS7GKu74plqwA3O3Ik'
);

app.post('/submit-order', async (req, res) => {
  try {
    const order = req.body;
    console.log('Received order:', order);  // 🐞 Debug log

    const totalPages = order.pageCount || 40;
    const shipping = order.shippingMethod || 'standard';
    const binding = order.bindingType || 'standard';
    const book = order.bookType || 'square';

    const base = {
      square: { standard: 700, layflat: 900, extra: { standard: 20, layflat: 25 } },
      portrait: { standard: 725, layflat: 1000, extra: { standard: 25, layflat: 30 } },
      landscape: { standard: 750, layflat: 1100, extra: { standard: 20, layflat: 35 } }
    };

    const shippingCost = shipping === 'standard' ? 250 : 650;
    const basePrice = base[book][binding];
    const extra = totalPages > 40 ? (totalPages - 40) * base[book].extra[binding] : 0;
    const total = basePrice + extra + shippingCost;

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        name: order.name,
        contact: order.contact,
        address: order.address,
        island: order.island,
        shipping: shipping,
        book_type: book,
        binding_type: binding,
        page_count: totalPages,
        total_mvr: total,
      }]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ success: false, error: 'Database insert failed.' });
    }

    console.log('✅ Supabase insert success:', data);
    return res.json({ success: true, orderId: data[0].id });
  } catch (err) {
    console.error('🔥 Server crash:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});