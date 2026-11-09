import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email, resetLink) {
  const { data, error } = await resend.emails.send({
    from: "BudgetWise <onboarding@resend.dev>",
    to: email,
    subject: "Reset your BudgetWise password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Password Reset</h2>

        <p>We received a request to reset your BudgetWise password.</p>

        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>

        <p>This link expires in 30 minutes.</p>

        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Unable to send password reset email");
  }

  return data;
}