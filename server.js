const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx'); // <-- SỬ DỤNG THƯ VIỆN MỚI

const app = express();

// ENDPOINT DUY NHẤT: LẤY DỮ LIỆU DẠNG JSON TỪ FILE EXCEL
app.get('/get-data', (req, res) => {
    // Đường dẫn trỏ thẳng tới file data.xlsx
    const xlsxFilePath = path.join(__dirname, 'public', 'data.xlsx');

    // 1. Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(xlsxFilePath)) {
        return res.status(404).json({ 
            error: "Data file (XLSX) not found on the server." 
        });
    }

    try {
        // 2. Đọc file Excel
        const workbook = XLSX.readFile(xlsxFilePath);
        
        // 3. Lấy ra sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 4. Chuyển đổi toàn bộ sheet đó thành JSON
        // Đây là bước "ma thuật", thư viện sẽ tự động làm hết cho bạn
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 5. Lọc bỏ các dòng trống (nếu có)
        const filteredData = jsonData.filter(row => {
            // Chúng ta giả định một dòng là hợp lệ nếu nó có 'id' và 'id' không rỗng
            // Bạn có thể đổi 'id' thành tên một cột khác mà bạn chắc chắn luôn có dữ liệu
            return row.id && String(row.id).trim() !== '';
        });

        // 6. Trả về dữ liệu JSON đã được làm sạch
        res.status(200).json(filteredData);

    } catch (error) {
        console.error('Error processing XLSX file:', error);
        res.status(500).json({ error: 'Failed to read or process the data file on the server.' });
    }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running and ready to serve data from XLSX at port ${PORT}`);
    console.log('Access data at /get-data');
});