import { Request, Response } from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class UploadFilesToS3 {
    
  public async singleUpload(req: Request, res: Response) : Promise <any> {
    try {

      const client = new S3Client({ region: process.env.AWS_REGION , credentials : {
        accessKeyId : process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY!
      }});

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
    
    const url = await getSignedUrl(client, new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: key,
      ContentType: file.mimetype,
    }),
    {
        expiresIn : 60
    }
    );
    //   console.log(url);
      const uploadResult = await axios.put(url , file.buffer , {
         headers: {
        "Content-Type": file.mimetype,
        "Content-Length": file.size,
      },
      maxBodyLength : Infinity
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
    } catch (err: any) {
    //   console.error("Error uploading file:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }

}

export default new UploadFilesToS3();