const express = require("express");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const SECRET = process.env.JWT_SECRET || 'supersecret';

// const { GridFsStorage } = require('multer-gridfs-storage');
// const Grid = require('gridfs-stream');
// const path = require('path');
// const crypto = require('crypto');

const app = express();

app.use(express.static('public'));

app.use(cors());

app.use(express.json());

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');


mongoose.connect(process.env.MONGO_URI);

// const upload = multer({ dest: 'uploads/' });

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const uniqueName = `${Date.now()}-${name}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

app.get('/download/:filename', requireAdmin, (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not foud '});
    }
});

const PrintJobSchema = new mongoose.Schema({
    name: String,
    fileName: String,
    filePath: String,
    storedFileName: String,
    material: String,
    color: String,
    status: {
        type: String,
        enum: ['queued', 'printing', 'done', 'failed'],
        default: 'queued',
    },
    notes: String,
    uploadedAt: { type: Date, default: Date.now },
});

// const userSchema = new mongoose.Schema({
//     username: { type: String, unique: true },
//     email: { type: String, unique: true },
//     passwordHash: String,
//     isAdmin: { type: Boolean, default: true },
// })

// module.exports = mongoose.model('User', userSchema)

const PrintJob = mongoose.model('PrintJob', PrintJobSchema);

app.post('/upload', upload.single('file'), async (req, res) => {
        // try {
        //     const newJob = new Job({
        //         name: req.body.name,
        //         email: req.body.email,
        //         notes: req.body.notes,
        //         filePath: req.file ? req.file.path : null // Store the file path if uploaded
        //     });
        //     await newJob.save();
        //     res.send('Data and file uploaded successfully!');
        // } catch (error) {
        //     console.error(error);
        //     res.status(500).send('Error uploading data and file.');
        // }

        const { name, material, color, notes } = req.body;
        const { originalname, filename, path } = req.file;

        const job = new PrintJob ({
            name,
            fileName: originalname,
            filePath: path,
            storedFileName: req.file.filename,
            material,
            color,
            notes,
        });

        await job.save();
        res.json({ message: 'Upload successful! '});
    });

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get("/queue", async (req, res) => {
    const jobs = await PrintJob.find().sort({ submittedAt: 1 });
    res.json(jobs);
});

app.patch('/job/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const job = await PrintJob.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Status updated' });
});

app.delete('/job/:id', requireAdmin, async (req, res) => {
    await PrintJob.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' })
});

app.get('/queue', requireAdmin, async (req, res) => {
    const jobs = await PrintJob.find().sort({ submittedAt: 1 });
    res.json(jobs);
});



app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await User.findOne({ username, isAdmin: true });
    console.log(user);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials '});

    const token = jwt.sign({ id: user._id, isAdmin: true }, SECRET, { expiresIn: '7d' });
    res.json({ token });
});

function requireAdmin(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided'});

    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        if(!decoded.isAdmin) throw new Error('Not admin');
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ error: 'Forbidden' });
    }
}


//app.post

app.listen(3000, function() {
    console.log("server is running on 3000")
})