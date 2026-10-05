import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const filename=fileURLToPath(import.meta.url);
const dirname=path.dirname(filename);
const datapath=path.join(dirname,"../data")
async function readData(filename) {
    const filepath=path.join(datapath,filename);
    console.log("READING FILE:", filepath);
    const data = await fs.readFile(filepath, "utf-8");
    return JSON.parse(data)
}
async function writeData(filename,data) {
    const filepath=path.join(datapath,filename);
    await fs.writeFile(filepath,JSON.stringify(data,null,2),"utf-8");
}
function getNextId(items) {
    if(items.length===0){
        return 1
    }
    const ids=items.map(item=>item.id);
    return Math.max(...ids) + 1;
}

export{
    readData,
    writeData,
    getNextId
}

