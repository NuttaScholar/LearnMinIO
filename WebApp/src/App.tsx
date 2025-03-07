import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Box, Button, Stack } from "@mui/material";
import * as Minio from 'minio'
import axios from "axios";


function App() {  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("กรุณาเลือกไฟล์ก่อนอัปโหลด");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("");
      setProgress(0);

      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      setMessage(`อัปโหลดสำเร็จ: ${response.data.fileName}`);
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <h2>อัปโหลดไฟล์</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <Button variant="contained" onClick={handleUpload} disabled={uploading}>
        {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
      </Button>
      {uploading && <progress value={progress} max="100">{progress}%</progress>}
      {message && <p>{message}</p>}
      
    </Box>
  );
}

export default App;
