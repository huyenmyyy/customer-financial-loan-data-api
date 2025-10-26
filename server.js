const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3000;

// === ENDPOINT DUY NHẤT: LẤY DỮ LIỆU DẠNG JSON ===
// Endpoint này sẽ đọc trực tiếp file data.csv trong thư mục public
app.get('/get-data', (req, res) => {
    const results = [];
    // Đường dẫn trỏ thẳng tới file data.csv mà chúng ta đã đặt sẵn
    const csvFilePath = path.join(__dirname, 'public', 'data.csv');

    // 1. Kiểm tra xem file có tồn tại không (chỉ để phòng hờ)
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ 
            error: "Data file not found on the server. Please check the deployment." 
        });
    }

    // 2. Đọc file CSV và chuyển thành JSON
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => {
            // Thêm bộ lọc: Chỉ thêm vào kết quả nếu dòng đó có 'id' và 'id' không phải là rỗng.
            if (data.id && data.id.trim() !== '') {
                results.push(data);
            }
        .on('end', () => {
            // 3. Khi đọc xong, trả về toàn bộ dữ liệu
            res.status(200).json(results);
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            res.status(500).json({ error: 'Failed to read data file on the server.' });
        });
});

// Khởi động server
// Render sẽ tự động cung cấp port, nên chúng ta cần code linh hoạt hơn một chút
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running and ready to serve data at port ${PORT}`);
    console.log('Access data at /get-data');
});