import { Resend } from "resend";
import { env } from "../../config/env.ts";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    try {
        const response = await resend.emails.send({
            from: env.EMAIL_FROM,
            to,
            subject,
            html,
        });

        return response;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Failed to send email");
    }
};
