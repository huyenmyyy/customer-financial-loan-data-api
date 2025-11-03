const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();

// --- HÀM HỖ TRỢ ĐỂ CHUYỂN ĐỔI NGÀY THÁNG TỪ SỐ CỦA EXCEL ---
// Hàm này nhận vào con số sê-ri của Excel và trả về chuỗi 'DD-MM-YYYY'
function excelDateToJSDateString(excelDate) {
    // Kiểm tra xem đầu vào có phải là một con số hợp lệ không
    if (typeof excelDate !== 'number' || isNaN(excelDate)) {
        // Nếu không phải số (ví dụ: đã là text sẵn), trả về y nguyên
        return excelDate; 
    }
    // Công thức chuẩn để chuyển đổi số sê-ri của Excel (từ năm 1900) sang mili giây của Javascript (từ năm 1970)
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    
    // Lấy ngày, tháng, năm và định dạng lại cho đẹp
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng trong JS bắt đầu từ 0
    const year = date.getFullYear();

    return `${day}-${month}-${year}`; // Trả về chuỗi DD-MM-YYYY
}


// ENDPOINT DUY NHẤT: LẤY DỮ LIỆU DẠNG JSON TỪ FILE EXCEL
app.get('/get-data', (req, res) => {
    const xlsxFilePath = path.join(__dirname, 'public', 'data.xlsx');

    if (!fs.existsSync(xlsxFilePath)) {
        return res.status(404).json({ 
            error: "Data file (XLSX) not found on the server." 
        });
    }

    try {
        const workbook = XLSX.readFile(xlsxFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Chuyển sheet thành JSON thô (vẫn còn số ngày tháng của Excel)
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Lọc bỏ các dòng trống
        const nonEmptyData = rawJsonData.filter(row => row.id && String(row.id).trim() !== '');

        // === PHẦN NÂNG CẤP: LẶP QUA TỪNG DÒNG VÀ SỬA LẠI NGÀY THÁNG ===
        const formattedData = nonEmptyData.map(row => {
            const newRow = { ...row }; 
            
            // DANH SÁCH CÁC CỘT NGÀY THÁNG BẠN MUỐN CHUYỂN ĐỔI
            const dateColumns = ['issue_date', 'last_credit_pull_date', 'last_payment_date', 'next_payment_date', 'last_updated'];
            
            dateColumns.forEach(colName => {
                if (newRow[colName]) {
                    newRow[colName] = excelDateToJSDateString(newRow[colName]);
                }
            });
            
            return newRow;
        });

        // Trả về dữ liệu đã được định dạng
        res.status(200).json(formattedData);

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