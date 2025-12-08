
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // APP PASSWORD
    },
});

transporter.verify((err, success) => {
    if (err) console.error("SMTP verify error:", err);
    else console.log("SMTP server is ready");
});

module.exports.generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

module.exports.hashOTP = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

const generateVerificationEmail = (otp) => {
    return `
  <!DOCTYPE html>
  <html lang="en">

  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>SecureExam Verification</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <tr>
              <td align="center">

                  <table width="600" cellpadding="0" cellspacing="0"
                      style="background:#ffffff; padding:30px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

                      <!-- Header -->
                      <tr>
                          <td align="center" style="padding-bottom:20px;">
                              <h2 style="margin:0; color:#2c3e50; font-size:24px; font-weight:700;">SecureExam</h2>
                              <p style="margin:5px 0 0; color:#6c757d; font-size:14px;">
                                  Zero-Trust Examination Security
                              </p>
                          </td>
                      </tr>

                      <!-- Greeting -->
                      <tr>
                          <td style="padding-bottom:20px; color:#2c3e50; font-size:16px;">
                              Hello,
                              <br><br>
                              Please use the verification code below to complete your account authentication.
                          </td>
                      </tr>

                      <!-- OTP BOX -->
                      <tr>
                          <td align="center" style="padding: 25px 0;">
                              <div
                                  style="font-size:32px; letter-spacing:6px; font-weight:700; color:#1a73e8; background:#eef5ff; padding:18px 30px; border-radius:6px; display:inline-block;">
                                  ${otp}
                              </div>
                          </td>
                      </tr>

                      <!-- Note -->
                      <tr>
                          <td style="padding-top:10px; font-size:14px; color:#6c757d;">
                              This code will expire in <strong>10 minutes</strong>.  
                              If you did not request this verification, please ignore this message.
                          </td>
                      </tr>

                      <!-- Divider -->
                      <tr>
                          <td style="padding:20px 0;">
                              <hr style="border:none; border-top:1px solid #e0e0e0;">
                          </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                          <td align="center" style="font-size:13px; color:#9ba1a6;">
                              © ${new Date().getFullYear()} SecureExam  
                              <br>
                              All rights reserved.
                          </td>
                      </tr>

                  </table>

              </td>
          </tr>
      </table>

  </body>

  </html>
  `;
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