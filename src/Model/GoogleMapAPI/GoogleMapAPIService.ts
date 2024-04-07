import axios from "axios";
import fs from "fs";
import "dotenv/config";
import path from "path";

interface GoogleMapTextSearchQuery {}

class GoogleMapAPIService {
  protected apiKey: String;
  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GoogleMapAPIKey;
  }
  async searchPlacesByText(query: GoogleMapTextSearchQuery) {
    try {
      const response = await axios.get("https://maps.googleapis.com/maps/api/place/textsearch/json", {
        params: {
          query: query,
          key: this.apiKey,
          language: "zh-TW",
        },
      });
      const results = response.data.results;
      if (results.length > 0) {
        return results[0];
      } else {
        throw new Error("找不到地點");
      }
    } catch (error) {
      throw error;
    }
  }

  async searchPlaceByID(ID: String) {
    try {
      const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
        params: {
          place_id: ID,
          key: this.apiKey,
          language: "zh-TW",
        },
      });

      const result = response.data.result;

      if (result) {
        let { geometry } = result;
        let { lat, lng } = geometry.location;
        result["lat"] = lat;
        result["lng"] = lng;
        return result;
      } else {
        throw new Error("找不到地點");
      }
    } catch (error) {
      throw error;
    }
  }

  async downloadPhoto(photoReference: String, restaurant_id: String) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/photo`;

    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "stream",
      params: {
        maxwidth: 400,
        photoreference: photoReference,
        key: this.apiKey,
        language: "zh-TW",
      },
    });
    let filename: String = `${restaurant_id}.jpg`;

    const filePath = path.resolve(__dirname, `../../../public/media/restaurantimage/${filename}`);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);
    return await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }
}

export default GoogleMapAPIService;
