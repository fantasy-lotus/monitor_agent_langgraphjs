import { z } from "zod";
import nodemailer from "nodemailer";

export const notifySchema = z.object({
  method: z.enum(["email", "sms"]),
  to: z.string().email(),
  content: z.string(),
});

export const sendNotification = async ({ method, to, content }: z.infer<typeof notifySchema>) => {
  if (method === "email") {
    const transporter = nodemailer.createTransport({
      service: "QQ",
      host: "smtp.qq.com",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Notification from Monitor",
      text: content,
    });
    if(result.accepted.length > 0) {
      console.log("邮件发送成功");
    }
    else {
      console.error("邮件发送失败", result.rejected);
    }
  }
};