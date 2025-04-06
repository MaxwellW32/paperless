"use server"
import nodemailer from "nodemailer"

require('dotenv').config()
const email = process.env.EMAIL_SERVER_USER
const pass = process.env.EMAIL_SERVER_PASSWORD

const transporter = nodemailer.createTransport({
    //egov setup need permision
    // host: process.env.EMAIL_SERVER_HOST,
    // port: parseInt(process.env.EMAIL_SERVER_PORT as string, 10),
    // secure: false, // true for port 465, false for other ports
    // auth: {
    //     user: email,
    //     pass: pass,
    // },

    service: "gmail",
    auth: {
        user: email,
        pass: pass,
    },
});

export async function sendEmail(input: {
    sendTo: string,
    replyTo: string | undefined,
    subject: string,
    body: {
        type: "html",
        html: string
    } | {
        type: "text",
        text: string
    },
}) {
    await transporter.sendMail({
        from: email,
        to: input.sendTo,
        subject: input.subject,
        text: input.body.type === "text" ? input.body.text : undefined,
        html: input.body.type === "html" ? input.body.html : undefined,
        replyTo: input.replyTo
    });
}