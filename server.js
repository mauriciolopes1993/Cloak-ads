const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure temp directories exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PROCESSED_DIR = path.join(__dirname, 'processed');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// In-memory job store
const jobs = {};

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const jobId = crypto.randomUUID();
  const inputPath = req.file.path;
  const isVideo = req.file.mimetype.startsWith('video');
  const outputFileName = `camuflado_${jobId}${path.extname(req.file.originalname)}`;
  const outputPath = path.join(PROCESSED_DIR, outputFileName);

  jobs[jobId] = {
    status: 'processing',
    progress: 0,
    downloadUrl: null,
    error: null,
  };

  res.json({ jobId, message: 'Processamento iniciado.' });

  // Process in background
  const command = ffmpeg(inputPath);

  // Remove metadata
  command.outputOptions('-map_metadata', '-1');
  command.outputOptions('-fflags', '+bitexact');

  if (isVideo) {
    const randomNoise = Math.floor(Math.random() * 5) + 1;
    const pitchFactor = (Math.random() * (1.05 - 1.01) + 1.01).toFixed(3);

    command.videoFilter(`noise=alls=${randomNoise}:allf=t`);
    command.audioFilter(`asetrate=44100*${pitchFactor},atempo=1/${pitchFactor}`);
    
    command.videoCodec('libx264');
    command.audioCodec('aac');
    command.outputOptions('-preset', 'ultrafast');
  } else {
    const randomNoise = Math.floor(Math.random() * 5) + 1;
    command.outputOptions('-vf', `noise=alls=${randomNoise}`);
  }

  command
    .on('progress', (progress) => {
      if (progress.percent) {
        jobs[jobId].progress = Math.min(Math.max(0, Math.round(progress.percent)), 99);
      }
    })
    .on('end', () => {
      jobs[jobId].status = 'completed';
      jobs[jobId].progress = 100;
      jobs[jobId].downloadUrl = `/download/${jobId}`;
      fs.unlink(inputPath, () => {}); // cleanup input
    })
    .on('error', (err) => {
      console.error('Processing error:', err);
      jobs[jobId].status = 'failed';
      jobs[jobId].error = err.message;
      fs.unlink(inputPath, () => {}); // cleanup input
    })
    .save(outputPath);
});

app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: 'Job não encontrado.' });
  }
  res.json(job);
});

app.get('/download/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job || job.status !== 'completed') {
    return res.status(404).json({ error: 'Arquivo não disponível.' });
  }

  const files = fs.readdirSync(PROCESSED_DIR);
  const file = files.find(f => f.startsWith(`camuflado_${req.params.jobId}`));

  if (!file) {
    return res.status(404).json({ error: 'Arquivo não encontrado no disco.' });
  }

  const filePath = path.join(PROCESSED_DIR, file);
  res.download(filePath, file, (err) => {
    if (!err) {
      // Cleanup after download
      setTimeout(() => {
        fs.unlink(filePath, () => {});
        delete jobs[req.params.jobId];
      }, 5000);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
