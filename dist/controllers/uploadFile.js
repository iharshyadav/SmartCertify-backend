"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const axios_1 = __importDefault(require("axios"));
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class UploadFilesToS3 {
    singleUpload(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = new client_s3_1.S3Client({ region: process.env.AWS_REGION, credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                    } });
                const file = req.file;
                //   console.log(file);
                if (!file) {
                    return res.status(400).json({ error: "No file uploaded" });
                }
                const MAX_FILE_SIZE = 100 * 1024 * 1024;
                if (file.size > MAX_FILE_SIZE) {
                    return res.status(400).json({ error: "File size exceeds the maximum limit of 100MB" });
                }
                const timestamp = Date.now();
                const key = `${file.originalname}-${timestamp}`;
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(client, new client_s3_1.PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME || "",
                    Key: key,
                    ContentType: file.mimetype,
                }), {
                    expiresIn: 60
                });
                //   console.log(url);
                const uploadResult = yield axios_1.default.put(url, file.buffer, {
                    headers: {
                        "Content-Type": file.mimetype,
                        "Content-Length": file.size,
                    },
                    maxBodyLength: Infinity
                });
                if (uploadResult.status !== 200) {
                    return res.status(500).json({ error: "Failed to upload file to S3" });
                }
                let fileUrl = `${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
                if (fileUrl.includes(" ")) {
                    fileUrl = fileUrl.replace(/ /g, "+");
                }
                return res.status(200).json({
                    success: true,
                    fileUrl
                });
            }
            catch (err) {
                //   console.error("Error uploading file:", err);
                return res.status(500).json({ error: "Internal server error", details: err.message });
            }
        });
    }
}
exports.default = new UploadFilesToS3();
