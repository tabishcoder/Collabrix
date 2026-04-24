
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: true,
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // APP PASSWORD
    },
});

// console.log({
//     SMTP_USER: process.env.SMTP_USER,
//     SMTP_PASS_LENGTH: process.env.SMTP_PASS?.length
// });
// // Avoid noisy startup failures. Validate SMTP only in production.
// if (process.env.NODE_ENV === 'production') {
//     transporter.verify((err) => {
//         if (err) console.error("SMTP verify error:", err);
//         else console.log("SMTP server is ready");
//     });
// }

module.exports.generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

module.exports.hashOTP = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

const generateVerificationEmail = (otp) => {
    return generateEmailTemplate('Account Verification', `
        Hello,<br><br>
        Please use the verification code below to complete your account authentication.
        <br><br>
        <div style="font-size:32px; letter-spacing:6px; font-weight:700; color:#1a73e8; background:#eef5ff; padding:18px 30px; border-radius:6px; display:inline-block; text-align:center;">
            ${otp}
        </div>
        <br><br>
        This code will expire in <strong>5 minutes</strong>.  
        If you did not request this verification, please ignore this message.
    `);
};

const generateInvitationEmail = (inviterName, projectName, inviteLink) => {
    return generateEmailTemplate('Project Invitation', `
        Hello,<br><br>
        <strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> on Collabrix.
        <br><br>
        To accept the invitation, please click the link below:
        <br><br>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}" style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Join Project
            </a>
        </div>
        <br>
        Or copy and paste this link into your browser: <br>
        <a href="${inviteLink}" style="color: #1a73e8;">${inviteLink}</a>
        <br><br>
        This invitation will expire in <strong>3 days</strong>.
    `);
};

// Extracted base layout to reuse
const generateEmailTemplate = (title, content) => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Collabrix ${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <tr>
              <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:30px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                      <tr>
                          <td align="center" style="padding-bottom:20px;">
                              <h2 style="margin:0; color:#2c3e50; font-size:24px; font-weight:700;">Collabrix</h2>
                              <p style="margin:5px 0 0; color:#6c757d; font-size:14px;">AI-Powered Remote Team Workspace</p>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding-bottom:20px; color:#2c3e50; font-size:16px;">
                              ${content}
                          </td>
                      </tr>
                      <tr>
                          <td style="padding:20px 0;">
                              <hr style="border:none; border-top:1px solid #e0e0e0;">
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="font-size:13px; color:#9ba1a6;">
                              © ${new Date().getFullYear()} Collabrix. <br>All rights reserved.
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`;
};

module.exports.sendEmail = async (to, otp) => {
    const html = generateVerificationEmail(otp);
    const subject = 'Account Verification (Collabrix)'
    await transporter.sendMail({
        from: `Collabrix <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
};

module.exports.sendProjectInvitationEmail = async (to, inviterName, projectName, inviteLink) => {
    const html = generateInvitationEmail(inviterName, projectName, inviteLink);
    const subject = `You've been invited to join ${projectName} on Collabrix`;
    await transporter.sendMail({
        from: `Collabrix <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
};

// Workspace invitation email
module.exports.sendWorkspaceInvitationEmail = async (to, inviterName, workspaceName, role, inviteLink) => {
    const html = generateEmailTemplate('Workspace Invitation', `
        Hello,<br><br>
        <strong>${inviterName}</strong> has invited you to join the workspace
        <strong>${workspaceName}</strong> on Collabrix as a <strong>${role}</strong>.
        <br><br>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${inviteLink}"
               style="background-color:#1a73e8;color:#ffffff;padding:12px 24px;
                      text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
                Join Workspace
            </a>
        </div>
        Or copy and paste this link into your browser:<br>
        <a href="${inviteLink}" style="color:#1a73e8;">${inviteLink}</a>
        <br><br>
        This invitation will expire in <strong>3 days</strong>.
        If you did not expect this invitation, you can safely ignore this email.
    `);
    const subject = `You've been invited to join ${workspaceName} on Collabrix`;
    await transporter.sendMail({
        from: `Collabrix <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
};