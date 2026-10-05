import crypto from "crypto";
function generateVerificationCode() {
    const code=crypto.randomInt(100000,1000000);
    return code.toString();
}
function generateTicketCode() {
    const chars= "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const result="";
    for (let i = 0; i < 6; i++) {
        const index = crypto.randomInt(0,chars.length);
        result+=chars[index]
    }
    return `EVH-${result}`;
}
export{
    generateVerificationCode,
    generateTicketCode
};