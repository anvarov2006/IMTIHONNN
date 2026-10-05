import nodemailer from "nodemailer";
const transporter=nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});
async function sendEmail({to,subject,html}) {
    return await transporter.sendMail({
        from: `EventHub <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
}
export{
    sendEmail
}