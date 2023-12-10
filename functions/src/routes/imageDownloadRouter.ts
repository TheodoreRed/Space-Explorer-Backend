import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/downloadImage", async (req, res) => {
  const imageUrl: string = req.query.url as string;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "binary");
    res.set("Content-Type", "image/jpeg");
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).send("Error fetching image");
  }
});

export default router;
