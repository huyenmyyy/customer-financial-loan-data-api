const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment'); // <-- THÊM THƯ VIỆN MỚI

const app = express();

// ENDPOINT DUY NHẤT: LẤY DỮ LIỆU DẠNG JSON TỪ FILE CSV
app.get('/get-data', (req, res) => {
    const results = [];
    const csvFilePath = path.join(__dirname, 'public', 'data.csv');

    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ 
            error: "Data file (CSV) not found on the server." 
        });
    }

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            // Lọc bỏ các dòng trống
            if (row.id && String(row.id).trim() !== '') {
                
                // === PHẦN NÂNG CẤP: ĐỊNH DẠNG LẠI NGÀY THÁNG ===
                // Liệt kê các cột ngày tháng cần xử lý
                const dateColumns = ['issue_date', 'last_credit_pull_date', 'last_payment_date', 'next_payment_date', 'last_updated'];

                dateColumns.forEach(colName => {
                    if (row[colName]) {
                        // Moment.js sẽ cố gắng "đoán" định dạng ngày tháng đầu vào (ví dụ: MM/DD/YYYY, YYYY-MM-DD,...)
                        // Sau đó, nó sẽ format lại theo đúng định dạng 'DD-MM-YYYY'
                        const formattedDate = moment(row[colName], 'DD-MM-YYYY').format('DD-MM-YYYY');

                        // Kiểm tra xem ngày tháng có hợp lệ không trước khi gán lại
                        if (formattedDate !== 'Invalid date') {
                            row[colName] = formattedDate;
                        }
                    }
                });

                results.push(row);
            }
        })
        .on('end', () => {
            res.status(200).json(results);
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
            res.status(500).json({ error: 'Failed to read data file on the server.' });
        });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running and ready to serve data from CSV at port ${PORT}`);
    console.log('Access data at /get-data');
});