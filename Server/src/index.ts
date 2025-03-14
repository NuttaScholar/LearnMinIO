import express, { Request, Response } from "express";
import * as Minio from "minio";
import multer, { FileFilterCallback } from "multer";
import cors from "cors";
import path from "path";

/*********************************************** */
// Instance 
/*********************************************** */
const app = express();

/*********************************************** */
// Config
/*********************************************** */
const bucketName = 'js-test-bucket';
const storagePath = path.resolve("upload");
const PORT = 5000;

console.log(storagePath);
/*********************************************** */
// Middleware Setup
/*********************************************** */
// อนุญาตให้ React frontend สามารถส่งคำขอมาได้
app.use(cors());

/*********************************************** */
// MinIO client Setup
/*********************************************** */
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: '3J5l4NrD1oyeZyOI26Zp',
  secretKey: 'AkTDFli3ol1m917H8AlIcaDlowAg34ax1v3iAdkH',
});

/*********************************************** */
// Multer Setup
// สำหรับจัดการการอัพโหลดไฟล์
/*********************************************** */
// กำหนดพื้นที่เก็บไฟล์อัปโหลด
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePath); // ไฟล์จะถูกเก็บในโฟลเดอร์ uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน
  },
});

// ฟังก์ชันตรวจสอบชนิดของไฟล์
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // อนุญาตเฉพาะไฟล์ภาพเท่านั้น
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // รับไฟล์นี้
  } else {
    cb(new Error('Only image files are allowed!')); // ปฏิเสธไฟล์นี้
  }
};

const upload = multer({ storage, fileFilter });

/*********************************************** */
// Routes Setup
/*********************************************** */
// สร้าง endpoint สำหรับอัปโหลดไฟล์
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  // เช็ค Request ว่ามีการอัปโหลดไฟล์หรือไม่
  if (!req.file) {
    res.status(400).json({ message: "กรุณาอัปโหลดไฟล์" });
    return;
  }
  try {
    // เช็ค Bucket ใน MinIO ว่ามีอยู่หรือไม่
    minioClient.bucketExists(bucketName).then((exists: boolean) => {
      if (exists) { // กรณีที่มี Bucket อยู่แล้ว
        console.log('Bucket ' + bucketName + ' exists.');
        // อัพโหลดไฟล์ไปเก็บไว้ใน MinIO 
        if (req.file) {
          minioClient.fPutObject(bucketName, req.file.filename, `${storagePath}/${req.file.filename}`).finally(() => {
            console.log('✅ File uploaded successfully:');
          })
        }

      } else { // กรณีที่ยังไม่มี Bucket ตรงตาม bucketName
        // สร้าง Bucket 
        minioClient.makeBucket(bucketName, 'us-east-1').finally(() => {
          console.log('Bucket ' + bucketName + ' created in "us-east-1".');
          // อัพโหลดไฟล์ไปเก็บไว้ใน MinIO 
          if (req.file) {
            minioClient.fPutObject(bucketName, req.file.filename, `${storagePath}/${req.file.filename}`).finally(() => {
              console.log('✅ File uploaded successfully:');
            })
          }
        })
      }
    })
    res.json({ fileName: req.file.filename, message: "อัปโหลดสำเร็จ!" });
  } catch (error) {
    res.status(500).json({ message: "อัปโหลดไม่สำเร็จ", error });
  }
});

/*********************************************** */
// Static Files Setup
/*********************************************** */
// สร้าง endpoint สำหรับเสิร์ฟไฟล์ที่อัปโหลด
app.use("/uploads", express.static(storagePath));

/*********************************************** */
// Start Server
/*********************************************** */
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
