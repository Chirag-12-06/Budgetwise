import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email, resetLink) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Reset your BudgetWise password",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>

      <a href="${resetLink}">
        Reset Password
      </a>

      <p>This link expires in 30 minutes.</p>
    `,
  });
}