const axios = require('axios');
const apiKey = '';
const fs = require('fs')

async function searchPlacesByText(query) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
                query: query,
                key: apiKey,
                language: 'zh-TW'
            }
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

async function searchPlaceByID(ID) {
    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                placeid : ID,
                key: apiKey,
                language: 'zh-TW'
            }
        });
        const results = response.data.result;
        if (results) {
            return results[0];
        } else {
            throw new Error("找不到地點");
        }
    } catch (error) {
        throw error;
    }
}

async function downloadPhoto(photoReference, restaurant_id) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;

    const response = await axios({
        url: apiUrl,
        method: 'GET',
        responseType: 'stream'
    });
    let filename = `${restaurant_id}.jpg`
    let imageurl = `http://10.18.83.80:80/restaurantimage/${filename}`
    const filePath =  __dirname + `../../../restaurantimage/${filename}`;
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve(imageurl));
        writer.on('error', reject);
    });
}

module.exports = {
    searchPlacesByText,
    searchPlaceByID,
    downloadPhoto
}