const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer();

app.use(cors({ origin: 'https://photo-foiy.netlify.app' }));
app.use(express.static('public'));

const supabase = createClient(
  'https://easuceuubzkidoykxfsu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhc3VjZXV1YnpraWRveWt4ZnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMTIwOTgsImV4cCI6MjA2MTY4ODA5OH0.CHpSpMCMQcWI4wefjNxLSvTDepS7GKu74plqwA3O3Ik'
);

app.post('/submit-order', upload.fields([
  { name: 'coverPhotos', maxCount: 10 },
  { name: 'albumPhotos', maxCount: 100 }
]), async (req, res) => {
  try {
    const fields = req.body;
    console.log("Received order:", fields);
    const orderId = uuidv4();

    const totalPages = parseInt(fields.pageCount || '40');
    const shipping = fields.shippingMethod || 'standard';
    const binding = fields.bindingType || 'standard';
    const book = fields.bookType || 'square';

    const base = {
      square: { standard: 700, layflat: 900, extra: { standard: 20, layflat: 25 } },
      portrait: { standard: 725, layflat: 1000, extra: { standard: 25, layflat: 30 } },
      landscape: { standard: 750, layflat: 1100, extra: { standard: 20, layflat: 35 } }
    };

    const shippingCost = shipping === 'standard' ? 250 : 650;
    const basePrice = base[book][binding];
    const extra = totalPages > 40 ? (totalPages - 40) * base[book].extra[binding] : 0;
    const total = basePrice + extra + shippingCost;

    const uploadImages = async (files, prefix) => {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.originalname.split('.').pop();
        const path = `${orderId}/${prefix}-${i + 1}.${ext}`;
        const { data, error } = await supabase.storage
          .from('photofoiy-uploads')
          .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });
        if (error) console.error(error);
        else urls.push(`https://easuceuubzkidoykxfsu.supabase.co/storage/v1/object/public/photofoiy-uploads/${path}`);
      }
      return urls;
    };

    const coverFiles = req.files['coverPhotos'] || [];
    const albumFiles = req.files['albumPhotos'] || [];

    const coverUrls = await uploadImages(coverFiles, 'cover');
    const albumUrls = await uploadImages(albumFiles, 'album');

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        name: fields.name,
        contact: fields.contact,
        address: fields.address,
        island: fields.island,
        shipping: shipping,
        book_type: book,
        binding_type: binding,
        page_count: totalPages,
        total_mvr: total,
        cover_image_urls: coverUrls,
        album_image_urls: albumUrls
      }]);

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ success: false, error: 'Insert failed' });
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Server crash' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});