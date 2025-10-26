const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const csv = require('csv-parser'); // <-- THÊM THƯ VIỆN MỚI

const app = express();
const port = 3000;

// Các thư mục cần thiết
const uploadsDir = 'uploads';
const publicDir = 'public';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage: storage });

app.use('/files', express.static(path.join(__dirname, publicDir)));

// === ENDPOINT 1: UPLOAD FILE (Giữ nguyên như cũ) ===
app.post('/upload', upload.single('dataFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        
        const outputCsvFileName = 'output.csv';
        const outputCsvPath = path.join(__dirname, publicDir, outputCsvFileName);
        fs.writeFileSync(outputCsvPath, csvData);

        fs.unlinkSync(req.file.path); // Xóa file excel tạm

        const fileUrl = `${req.protocol}://${req.get('host')}/files/${outputCsvFileName}`;
        res.status(200).json({
            message: 'Excel file processed. Data is ready at /get-data endpoint.',
            link_to_file: fileUrl // Trả về cả link file nếu cần
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing the file.');
    }
});


// === ENDPOINT 2: LẤY DỮ LIỆU DẠNG JSON (Phần mới) ===
app.get('/get-data', (req, res) => {
    const results = [];
    const csvFilePath = path.join(__dirname, publicDir, 'output.csv');

    // 1. Kiểm tra xem file data đã tồn tại chưa
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ 
            error: "Data file not found. Please upload an Excel file to the /upload endpoint first." 
        });
    }

    // 2. Đọc file CSV và chuyển thành JSON
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data)) // Với mỗi dòng đọc được, đẩy vào mảng results
        .on('end', () => {
            // 3. Khi đọc xong, trả về toàn bộ mảng results dưới dạng JSON
            res.status(200).json(results);
        })
        .on('error', (error) => {
            // Xử lý nếu có lỗi trong quá trình đọc file
            console.error('Error reading CSV file:', error);
            res.status(500).json({ error: 'Failed to read data file.' });
        });
});


// Khởi động server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  POST /upload   (to upload Excel file)');
    console.log('  GET /get-data  (to view data as JSON)');
});