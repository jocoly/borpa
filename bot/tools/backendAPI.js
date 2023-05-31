import * as path from "path";
import * as fs from "fs";
import fetch from "node-fetch";
import util from 'util';
import {getFileSize} from "./getFileSize.js";
import {waitForFileToComplete} from "./waitForFileToComplete.js";

const REQUEST_TIMEOUT_SEC = 120000
export async function callDalleService(backendUrl, text, numImages) {

    const queryStartTime = new Date();

    const response = await Promise.race([
        fetch(backendUrl + `/generate`, {
            method: 'POST',
            headers: {
                'Bypass-Tunnel-Reminder': "go",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                'num_images': parseInt(numImages),
                'output_dir': process.env.OUTPUT_DIR
            })
        }).then((response) => {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), REQUEST_TIMEOUT_SEC))
    ]);

    const jsonResponse = await response.json();
    const results = [];

    for (const generatedImg of jsonResponse.generatedImgs) {
        const imageFileName = Math.random().toString(36).substring(7) + '.png'; // generate random file name
        const imagePath = path.join(process.env.OUTPUT_DIR, imageFileName); // join the path to the image file
        const imageData = Buffer.from(generatedImg, 'base64');
        fs.writeFileSync(imagePath, imageData);
        results.push({
            executionTime: Math.round(
                ((new Date() - queryStartTime) / 1000 + Number.EPSILON) * 100
            ) / 100,
            imageFilePath: imagePath,
        });
    }
    const queryEndTime=  new Date();
    console.log(`Stable Diffusion query took ${queryEndTime - queryStartTime} ms`);
    return results;
}

export async function callTextToVideoService (videoBackendUrl, prompt, seed) {

    const queryStartTime = new Date();

    const response = await Promise.race([
        fetch(videoBackendUrl + `/generateVideo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: prompt,
            })
        }).then((response) => {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), REQUEST_TIMEOUT_SEC))
    ]);

    const {actualOutPath, _} = await response.json();
    const results = [];

    const videoFileName = path.basename(actualOutPath);
    const videoPath = path.join('C:/Users/Colin/PycharmProjects/borpa/video-backend/output/videos/', videoFileName)

    results.push({
        executionTime: Math.round(((new Date() - queryStartTime) / 1000 + Number.EPSILON) * 100) / 100,
        videoFilePath: videoPath,
    })

    const fileSize = await getFileSize(videoPath);
    await waitForFileToComplete(videoPath, fileSize);

    const queryEndTime=  new Date();
    console.log(`Text-to-video query took ${queryEndTime - queryStartTime} ms`);
    return results;
}

