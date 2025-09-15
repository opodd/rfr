import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Pool } from '@neondatabase/serverless';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({ 
  connectionString: 'postgresql://neondb_owner:npg_G2QtcmBkZ0Ra@ep-shy-sea-a1pxx7rd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' 
});

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads (memory storage for database)
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize database
async function initDB() {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price VARCHAR(50),
        image_url VARCHAR(500),
        sold_out BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add new columns for storing images in database
    try {
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data BYTEA');
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_mimetype VARCHAR(100)');
      await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255)');
      console.log('Database schema updated successfully');
    } catch (alterError) {
      // Columns might already exist, which is fine
      console.log('Database columns already exist or alter failed:', alterError.message);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    
    // Convert products to include proper image URLs
    const productsWithImages = rows.map(product => {
      const hasImage = product.image_mimetype ? true : false;
      const imageUrl = hasImage ? `/api/products/${product.id}/image` : product.image_url;
      
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        sold_out: product.sold_out,
        created_at: product.created_at,
        image_url: imageUrl
      };
    });
    
    console.log('Fetched products:', productsWithImages.map(p => ({
      id: p.id,
      title: p.title,
      has_image_url: !!p.image_url,
      image_url: p.image_url
    })));
    
    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Add new product
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let result;
    if (req.file) {
      console.log('Original image:', {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.buffer.length
      });
      
      // Compress and resize image using Sharp
      const compressedImage = await sharp(req.file.buffer)
        .resize(800, 800, { // Resize to max 800x800, maintain aspect ratio
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ // Convert to JPEG for better compression
          quality: 80,
          progressive: true
        })
        .toBuffer();
      
      console.log('Compressed image:', {
        original_size: req.file.buffer.length,
        compressed_size: compressedImage.length,
        compression_ratio: `${Math.round((1 - compressedImage.length / req.file.buffer.length) * 100)}%`
      });
      
      // Store compressed image in database
      const { rows } = await pool.query(
        'INSERT INTO products (title, description, price, image_data, image_mimetype, image_filename) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, description, price, image_mimetype, image_filename, sold_out, created_at',
        [title, description || '', price || '', compressedImage, 'image/jpeg', req.file.originalname]
      );
      result = rows;
    } else {
      console.log('Adding product without image');
      // No image provided
      const { rows } = await pool.query(
        'INSERT INTO products (title, description, price) VALUES ($1, $2, $3) RETURNING id, title, description, price, image_mimetype, image_filename, sold_out, created_at',
        [title, description || '', price || '']
      );
      result = rows;
    }

    const product = result[0];
    product.image_url = product.image_mimetype ? `/api/products/${product.id}/image` : null;
    
    console.log('Product added successfully:', {
      id: product.id,
      title: product.title,
      has_image: !!product.image_mimetype,
      image_url: product.image_url
    });

    res.json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get product image
app.get('/api/products/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Serving image for product:', id);
    
    const { rows } = await pool.query(
      'SELECT image_data, image_mimetype, image_filename FROM products WHERE id = $1 AND image_data IS NOT NULL',
      [id]
    );

    if (rows.length === 0) {
      console.log('Image not found for product:', id);
      return res.status(404).json({ error: 'Image not found' });
    }

    const { image_data, image_mimetype, image_filename } = rows[0];
    console.log('Serving image:', {
      productId: id,
      mimetype: image_mimetype,
      filename: image_filename,
      size: image_data.length
    });
    
    // Set caching headers for better performance
    res.setHeader('Content-Type', image_mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${image_filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('ETag', `"${id}-${image_data.length}"`); // ETag for conditional requests
    
    // Check if client has cached version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === `"${id}-${image_data.length}"`) {
      return res.status(304).end(); // Not Modified
    }
    
    res.send(Buffer.from(image_data));
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Update product (toggle sold_out or edit details)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sold_out, title, description, price } = req.body;

    let result;
    if (sold_out !== undefined) {
      // Toggle sold_out status
      const { rows } = await pool.query(
        'UPDATE products SET sold_out = $1 WHERE id = $2 RETURNING *',
        [sold_out, id]
      );
      result = rows;
    } else {
      // Update product details
      const { rows } = await pool.query(
        'UPDATE products SET title = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
        [title, description, price, id]
      );
      result = rows;
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete product and its image data from database
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id, image_filename',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`Product ${id} and its image data deleted from database`);
    res.json({ message: 'Product and image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Start server
app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});