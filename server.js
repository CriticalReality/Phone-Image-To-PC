// server.js
import express from "express";
import https from "https";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const destDir = process.env.DEST_DIR || "converted/";

  fs.mkdirSync(destDir, { recursive: true });
  const input = file.path;
  let output;

  if (file.originalname.toLowerCase().endsWith(".heic")) {
    output = `${destDir}/${file.originalname.replace(/\.heic$/i, ".png")}`;
    await sharp(input).png().toFile(output);
  } else if (/\.(mp4|mov|avi)$/i.test(file.originalname)) {
    output = `${destDir}/${file.originalname.replace(/\.[^.]+$/, ".wav")}`;
    await new Promise((res2, rej) =>
      ffmpeg(input).noVideo().save(output).on("end", res2).on("error", rej)
    );
  } else {
    output = `${destDir}/${file.originalname}`;
    fs.renameSync(input, output);
  }

  res.json({ success: true, saved: output });
});

// HTTPS cert generation (self-signed for local use)
const certOptions = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

https.createServer(certOptions, app).listen(8443, () => {
  console.log("Server running on https://<PC-IP>:8443");
});
