import express, { Request, Response } from "express";
import * as Minio from "minio";
import multer, { FileFilterCallback } from "multer";
import cors from "cors";
import path from "path";

const app = express();
const PORT = 5000;

// อนุญาตให้ React frontend สามารถส่งคำขอมาได้
app.use(cors());

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: '3J5l4NrD1oyeZyOI26Zp',
  secretKey: 'AkTDFli3ol1m917H8AlIcaDlowAg34ax1v3iAdkH',
});
// Destination bucket
const bucket = 'js-test-bucket';

const storagePath = "/Playground/Server/uploads";

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

// สร้าง endpoint สำหรับอัปโหลดไฟล์
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: "กรุณาอัปโหลดไฟล์" });
    return;
  }
  try {

    minioClient.bucketExists(bucket).then((exists: boolean) => {
      if (exists) {
        console.log('Bucket ' + bucket + ' exists.');
        if (req.file) {
          minioClient.fPutObject(bucket, req.file.filename, `${storagePath}/${req.file.filename}`).finally(() => {
            console.log('✅ File uploaded successfully:');
          })
        }

      } else {
        minioClient.makeBucket(bucket, 'us-east-1').finally(() => {
          console.log('Bucket ' + bucket + ' created in "us-east-1".');
          if (req.file) {
            minioClient.fPutObject(bucket, req.file.filename, `${storagePath}/${req.file.filename}`).finally(() => {
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

// สร้าง endpoint สำหรับเสิร์ฟไฟล์ที่อัปโหลด
app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
