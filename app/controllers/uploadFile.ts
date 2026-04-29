type Request = any;
type Response = any;
import { v2 as cloudinary } from "cloudinary";

// Configure once at module load
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a buffer to Cloudinary via upload_stream.
 * Returns { secure_url, public_id }.
 */
function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = "smartcertify/certificates"
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    // Write buffer directly then end the stream
    uploadStream.end(buffer);
  });
}

class UploadFileController {
  public async singleUpload(req: Request, res: Response): Promise<any> {
    try {
      const file = req.file;

      console.log("[Upload] Request received:", {
        hasFile: !!file,
        fileName: file?.originalname,
        fileSize: file?.size,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      });

      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({ success: false, error: "File buffer is empty — check multer config" });
      }

      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
      if (file.size > MAX_SIZE) {
        return res.status(400).json({ success: false, error: "File size exceeds 10MB limit" });
      }

      console.log("[Upload] Uploading to Cloudinary...");
      const { secure_url, public_id } = await uploadBufferToCloudinary(file.buffer);
      console.log("[Upload] SUCCESS:", secure_url);

      return res.status(200).json({
        success: true,
        fileUrl: secure_url,
        cloudinaryId: public_id,
      });
    } catch (err: any) {
      console.error("[Upload] Cloudinary error:", err?.message || err);
      return res.status(500).json({
        success: false,
        error: "Upload failed",
        details: err?.message || "Unknown error",
      });
    }
  }
}

export default new UploadFileController();
export { uploadBufferToCloudinary };