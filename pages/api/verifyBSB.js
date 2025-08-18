// pages/api/verifyBSB.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { bsb:bsbcode } = req.body;

  if (!bsbcode) {
    return res.status(400).json({ message: "BSB code is required" });
  }

  try {
    const apiResponse = await axios.post(
      "https://auspaynet-bicbsb-api-prod.azure-api.net/BSBQuery-V2/manual/paths/invoke",
      { bsbcode },
      {
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": "4a6f5b91d40d4b6ea117d9d8c68b8371",
          // If they require auth header, uncomment the line below:
           "Primary": "CX_BSB",
        },
      }
    );

    if (apiResponse.data && apiResponse.data.data) {
      const parsedData = JSON.parse(apiResponse.data.data);

      if (parsedData.length > 0) {
        return res.status(200).json({
          status: "success",
          bankName: parsedData[0].FIName.trim(),
        });
      }
    }

    return res.status(404).json({
      status: "error",
      message: "Invalid BSB or bank not found",
    });
  } catch (error) {
    console.error("BSB API Error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to verify BSB",
    });
  }
}
