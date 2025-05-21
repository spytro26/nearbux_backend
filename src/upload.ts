import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from './index';
import dotenv from 'dotenv';
import fs from 'fs/promises'; // Use promise-based fs

dotenv.config();

const router = express.Router();

// Multer config with 5MB limit
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

cloudinary.config({
  cloud_name: 'dvjcznll3',
  api_key: '229598794516194',
  api_secret: process.env.image_upload_key,
});
//@ts-ignore
router.post('/upload-image', upload.single('image'), async (req, res) => {
  let filePath = ''; // Track for cleanup

  try {
    if (!req.file) {
      console.error(' No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const { productId, shopId } = req.body;

    // Check if file actually exists on disk
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.error('File not found on server:', filePath);
      return res.status(400).json({ error: 'File not found on server' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: `shop_product_${Date.now()}`,
    });

    const imageUrl = result.secure_url;
    console.log(imageUrl) ;
    console.log(productId, shopId)  ;

    // hehe
    if (productId) {
      console.log("into the prodcutId");
      await prisma.product.update({
        where: { id: parseInt(productId) },
        data: { image: imageUrl },
      });
    };

    if (shopId) {
      console.log("into the shopId");
      await prisma.shop.update({
        where: { id : parseInt(shopId) },
        data: { image: imageUrl },
      });
    };

    
    await fs.unlink(filePath);
    

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(' Upload failed:', error);

    
    if (filePath) {
      try {
        await fs.unlink(filePath);
      
      } catch (unlinkErr) {
        console.error(' Failed to delete temp file:', unlinkErr);
      }
    }

    res.status(500).json({ error: 'Image upload failed', details: error });
  }
});

export default router;
