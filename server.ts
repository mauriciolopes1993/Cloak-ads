import express from "express";
import path from "path";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

// Ensure directories exist
const UPLOADS_DIR = path.resolve("uploads");
const PROCESSED_DIR = path.resolve("processed");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Firebase Setup (Mocked here for SaaS instruction purposes)
  // In a real app, initialize firebase-admin:
  // import * as admin from 'firebase-admin';
  // admin.initializeApp({ credential: admin.credential.cert(process.env.FIREBASE_CREDENTIALS) });
  
  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Camouflage API (Injects subtle noise & clears metadata to change file hash and avoid detection)
  app.post("/api/process/camouflage", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const inputPath = req.file.path;
    const outputFileName = `camouflaged_${uuidv4()}${path.extname(req.file.originalname)}`;
    const outputPath = path.join(PROCESSED_DIR, outputFileName);
    const isVideo = req.file.mimetype.startsWith("video");

    console.log(`Analyzing pre-processing for ${inputPath}`);

    // Pre-processing Analysis
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        console.error("FFprobe error:", err);
        fs.unlink(inputPath, () => {});
        return res.status(500).json({ error: "Erro ao analisar o arquivo de mídia." });
      }

      // Check for forbidden metadata patterns (mocked logic based on headers)
      let foundForbiddenMetadata = false;
      if (metadata.format && metadata.format.tags) {
        const tags = metadata.format.tags;
        const forbiddenKeys = ['software', 'encoder', 'comment', 'creation_time'];
        for (const key of forbiddenKeys) {
          if (tags[key] || tags[key.toUpperCase()]) {
            foundForbiddenMetadata = true;
            console.log(`Forbidden metadata found: ${key}. Will be removed.`);
          }
        }
      }

      console.log(`Processing camouflage for ${inputPath}`);

      const command = ffmpeg(inputPath);
      
      // Clear all metadata
      command.outputOptions("-map_metadata", "-1");
      // Remove any custom metadata flags
      command.outputOptions("-fflags", "+bitexact");

      if (isVideo) {
        // Randomization layer
        // Noise intensity between 1 and 5
        const randomNoise = Math.floor(Math.random() * 5) + 1;
        // Pitch alteration factor between 1.01 and 1.05 (slightly higher pitch, adjusting tempo to match duration)
        const pitchFactor = (Math.random() * (1.05 - 1.01) + 1.01).toFixed(3);

        // Add subtle noise to video to alter hash drastically, maintaining quality
        command.videoFilter(`noise=alls=${randomNoise}:allf=t`);
        // Alter audio pitch randomly to bypass audio fingerprinting
        command.audioFilter(`asetrate=44100*${pitchFactor},atempo=1/${pitchFactor}`);
        
        // Re-encode to force hash change
        command.videoCodec("libx264");
        command.audioCodec("aac"); // Re-encode audio too to be safe
      } else {
        // Image: Add subtle noise
        const randomNoise = Math.floor(Math.random() * 5) + 1;
        command.outputOptions("-vf", `noise=alls=${randomNoise}`);
      }

      command
        .on("end", () => {
          console.log("Camouflage processing finished.");
          res.json({ 
            success: true, 
            downloadUrl: `/api/download/${outputFileName}`,
            metadataCleaned: foundForbiddenMetadata 
          });
          // Clean up input file
          fs.unlink(inputPath, () => {});
        })
        .on("error", (err) => {
          console.error("Error processing file:", err);
          res.status(500).json({ error: "Error processing file", details: err.message });
          fs.unlink(inputPath, () => {});
        })
        .save(outputPath);
    });
  });

  // Clean Metadata API (Only clears metadata without video re-encoding if possible)
  app.post("/api/process/clean-metadata", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const inputPath = req.file.path;
    const outputFileName = `clean_${uuidv4()}${path.extname(req.file.originalname)}`;
    const outputPath = path.join(PROCESSED_DIR, outputFileName);
    const isVideo = req.file.mimetype.startsWith("video");

    console.log(`Processing metadata cleanup for ${inputPath}`);

    const command = ffmpeg(inputPath);
    
    // Clear all metadata
    command.outputOptions("-map_metadata", "-1");

    if (isVideo) {
      // Copy streams without re-encoding to save time, only removing metadata
      command.videoCodec("copy");
      command.audioCodec("copy");
    }

    command
      .on("end", () => {
        console.log("Metadata cleanup processing finished.");
        res.json({ success: true, downloadUrl: `/api/download/${outputFileName}` });
        fs.unlink(inputPath, () => {});
      })
      .on("error", (err) => {
        console.error("Error processing file:", err);
        res.status(500).json({ error: "Error processing file", details: err.message });
        fs.unlink(inputPath, () => {});
      })
      .save(outputPath);
  });

  // Download processed files
  app.get("/api/download/:filename", (req, res) => {
    const filePath = path.join(PROCESSED_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (!err) {
          // Cleanup after successful download
          setTimeout(() => {
            fs.unlink(filePath, () => {});
          }, 5000);
        }
      });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Since Express v4 is used (from package.json), we use '*'
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
