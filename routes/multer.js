const multer = require('multer');
const { v4: uuid4 } = require('uuid');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuid4();
        const fileExtension = path.extname(file.originalname);
        const finalFileName = `${uniqueFilename}${fileExtension}`;
        cb(null, finalFileName);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;

