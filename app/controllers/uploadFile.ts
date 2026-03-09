import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

class UploadFilesToLocal {

  public async singleUpload(req: Request, res: Response): Promise<any> {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "File size exceeds the maximum limit of 100MB" });
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), "uploads");
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generate a unique filename
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeName}-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Construct the local URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:8000';
      const fileUrl = `${baseUrl}/uploads/${filename}`;

      return res.status(200).json({
        success: true,
        fileUrl
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }

}

export default new UploadFilesToLocal();