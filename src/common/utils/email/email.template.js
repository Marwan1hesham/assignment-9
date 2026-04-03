export const emailTemplate = (otp) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification</title>
</head>

<body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4;">
  
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4; padding:20px 0;">
    <tr>
      <td align="center">
        
        <!-- Main Container -->
        <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:30px; text-align:center;">
          
          <!-- App Name -->
          <tr>
            <td>
              <h2 style="margin:0; color:#333;">Saraha App</h2>
              <p style="color:#888; margin:5px 0 20px;">Anonymous Messages</p>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td>
              <h3 style="color:#333;">Verify Your Email</h3>
              <p style="color:#666; font-size:14px;">
                Use the OTP below to complete your verification process.
              </p>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td>
              <div style="
                margin:20px auto;
                padding:15px;
                font-size:28px;
                font-weight:bold;
                letter-spacing:5px;
                color:#ffffff;
                background-color:#4CAF50;
                border-radius:8px;
                width:fit-content;
              ">
                Code: ${otp}
              </div>
            </td>
          </tr>

          <!-- Expiry Info -->
          <tr>
            <td>
              <p style="color:#999; font-size:12px;">
                This code will expire in 5 minutes.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="color:#aaa; font-size:12px;">
                If you didn’t request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
};
