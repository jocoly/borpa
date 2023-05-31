import util from "util";
import fs from "fs";

const stat = util.promisify(fs.stat);

export async function getFileSize(filePath) {
    const stats = await stat(filePath);
    return stats.size;
}