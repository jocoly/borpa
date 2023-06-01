import {getFileSize} from "./getFileSize.js";
import {sleep} from "./sleep.js";

export async function waitForFileToComplete(filePath, initialSize) {

    const checkInterval = 1000;
    const completionThreshold = 5000;

    let fileSize = initialSize;
    let unchangedTime = 0;

    while (unchangedTime < completionThreshold) {
        await sleep(checkInterval);
        const newSize = await getFileSize(filePath);
        if (newSize === fileSize) {
            unchangedTime += checkInterval;
        } else {
            fileSize = newSize;
            unchangedTime = 0;
        }
    }
}