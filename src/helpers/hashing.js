import bcrypt from "bcrypt";
const SALT_ROUNDS=10;
async function hashValue(value) {
    return await bcrypt.hash(value,SALT_ROUNDS);
}
async function compareValue(value,hashedvalue) {
    return await bcrypt.compare(value,hashedvalue);
}
export{
    hashValue,
    compareValue
}