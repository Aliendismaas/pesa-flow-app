export const verifyEmailTemplate = (
  url: string,
  brandColor: string = "#059669"
) => ({
  subject: "Confirm your PesaFlow account",
  text: `Please verify your email address by clicking the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
      .container { max-width: 600px; margin: 30px auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05); }
      .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; font-size: 26px; color: #ffffff; padding: 24px; text-align: center; border-radius: 12px; letter-spacing: -0.5px; }
      .content { padding: 28px 8px 16px; text-align: center; }
      .content h1 { font-size: 22px; color: #0f172a; font-weight: 700; margin-bottom: 12px; }
      .content p { font-size: 15px; color: #475569; line-height: 1.6; margin: 10px 0 24px; }
      .button { display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; background-color: ${brandColor}; color: #ffffff !important; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
      .footer { font-size: 13px; color: #94a3b8; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }
    </style></head><body>
      <div class="container">
        <div class="header">PesaFlow</div>
        <div class="content">
          <h1>Confirm Your Email Address</h1>
          <p>Thank you for signing up for PesaFlow! Please confirm your account by clicking the button below.</p>
          <a href="${url}" class="button">Confirm Account</a>
          <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you did not request this, please disregard this email.</p>
        </div>
        <div class="footer">
          <p>PesaFlow &bull; Personal Financial Management</p>
        </div>
      </div>
    </body></html>
  `,
});

export const passwordResetTemplate = (
  url: string,
  brandColor: string = "#059669"
) => ({
  subject: "Reset Your PesaFlow Password",
  text: `To reset your password, please click the following link: ${url}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
      .container { max-width: 600px; margin: 30px auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05); }
      .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; font-size: 26px; color: #ffffff; padding: 24px; text-align: center; border-radius: 12px; letter-spacing: -0.5px; }
      .content { padding: 28px 8px 16px; text-align: center; }
      .content h1 { font-size: 22px; color: #0f172a; font-weight: 700; margin-bottom: 12px; }
      .content p { font-size: 15px; color: #475569; line-height: 1.6; margin: 10px 0 24px; }
      .button { display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; background-color: ${brandColor}; color: #ffffff !important; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
      .footer { font-size: 13px; color: #94a3b8; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }
    </style></head><body>
      <div class="container">
        <div class="header">PesaFlow</div>
        <div class="content">
          <h1>Reset Your Password</h1>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>
          <a href="${url}" class="button">Reset Password</a>
          <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>PesaFlow &bull; Personal Financial Management</p>
        </div>
      </div>
    </body></html>
  `,
});

export const adminNewRegistrationNotificationTemplate = (
  userData: {
    name: string;
    email: string;
    createdAt?: Date;
    userAgent?: string;
  },
  reviewUrl: string,
  brandColor: string = "#059669"
) => ({
  subject: `[PesaFlow Alert] New Account Registration Request: ${userData.name}`,
  text: `A new user has registered on PesaFlow and is waiting for your approval:\n\nName: ${userData.name}\nEmail: ${userData.email}\nDate: ${userData.createdAt ? new Date(userData.createdAt).toLocaleString() : new Date().toLocaleString()}\n\nReview & Approve in Admin Portal: ${reviewUrl}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
      .container { max-width: 600px; margin: 30px auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05); }
      .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; font-size: 24px; color: #ffffff; padding: 22px; text-align: center; border-radius: 12px; }
      .badge { display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 14px; }
      .content { padding: 24px 8px 16px; }
      .content h1 { font-size: 20px; color: #0f172a; font-weight: 700; margin: 12px 0 8px; text-align: center; }
      .content p { font-size: 14px; color: #475569; line-height: 1.6; text-align: center; margin-bottom: 20px; }
      .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0 24px; }
      .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .card-row:last-child { margin-bottom: 0; }
      .label { color: #64748b; font-weight: 500; }
      .value { color: #0f172a; font-weight: 600; }
      .btn-container { text-align: center; margin-top: 24px; }
      .button { display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; background-color: ${brandColor}; color: #ffffff !important; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
      .footer { font-size: 13px; color: #94a3b8; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }
    </style></head><body>
      <div class="container">
        <div class="header">PesaFlow Super Admin</div>
        <div class="content">
          <div style="text-align: center;"><span class="badge">Pending Approval</span></div>
          <h1>New User Registration Request</h1>
          <p>A new user has submitted a registration request on PesaFlow. Review their information below to approve or decline access.</p>
          
          <div class="card">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Full Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${userData.name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Email Address:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${userData.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">Request Time:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${new Date().toLocaleString()}</td>
              </tr>
              ${
                userData.userAgent
                  ? `<tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500;">Device/Agent:</td>
                <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-align: right;">${userData.userAgent.slice(0, 45)}...</td>
              </tr>`
                  : ""
              }
            </table>
          </div>

          <div class="btn-container">
            <a href="${reviewUrl}" class="button">Review & Approve in Admin Portal</a>
          </div>
        </div>
        <div class="footer">
          <p>PesaFlow Admin Notification &bull; Autonomous Security System</p>
        </div>
      </div>
    </body></html>
  `,
});

export const userAccountApprovedTemplate = (
  userData: { name: string },
  loginUrl: string,
  brandColor: string = "#059669"
) => ({
  subject: "Your PesaFlow Account Has Been Approved! 🎉",
  text: `Hi ${userData.name},\n\nGreat news! Your PesaFlow account has been reviewed and approved by the Super Admin.\n\nYou can now log in at: ${loginUrl}`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
      .container { max-width: 600px; margin: 30px auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05); }
      .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); font-weight: 800; font-size: 26px; color: #ffffff; padding: 24px; text-align: center; border-radius: 12px; }
      .content { padding: 28px 8px 16px; text-align: center; }
      .content h1 { font-size: 22px; color: #0f172a; font-weight: 700; margin-bottom: 12px; }
      .content p { font-size: 15px; color: #475569; line-height: 1.6; margin: 10px 0 24px; }
      .button { display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; background-color: ${brandColor}; color: #ffffff !important; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
      .footer { font-size: 13px; color: #94a3b8; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }
    </style></head><body>
      <div class="container">
        <div class="header">PesaFlow</div>
        <div class="content">
          <h1>Account Approved! 🎉</h1>
          <p>Hello <strong>${userData.name}</strong>,</p>
          <p>Your access request has been reviewed and approved by the Super Admin. Your account is now fully active, and you can log in to begin tracking your bank accounts and finances.</p>
          <a href="${loginUrl}" class="button">Log In to PesaFlow</a>
        </div>
        <div class="footer">
          <p>PesaFlow &bull; Personal Financial Management</p>
        </div>
      </div>
    </body></html>
  `,
});

export const userAccountRejectedTemplate = (
  userData: { name: string; reason?: string }
) => ({
  subject: "Update Regarding Your PesaFlow Account Application",
  text: `Hi ${userData.name},\n\nThank you for your interest in PesaFlow. After review, your registration request could not be approved at this time.${userData.reason ? `\n\nReason: ${userData.reason}` : ""}\n\nIf you believe this was a mistake, please reach out to the administrator.`,
  html: `
    <html><head><style>
      body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
      .container { max-width: 600px; margin: 30px auto; padding: 32px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05); }
      .header { background: #64748b; font-weight: 800; font-size: 24px; color: #ffffff; padding: 22px; text-align: center; border-radius: 12px; }
      .content { padding: 28px 8px 16px; text-align: center; }
      .content h1 { font-size: 20px; color: #0f172a; font-weight: 700; margin-bottom: 12px; }
      .content p { font-size: 14px; color: #475569; line-height: 1.6; margin: 10px 0 16px; }
      .reason-box { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 14px; border-radius: 8px; font-size: 13px; margin: 16px 0; text-align: left; }
      .footer { font-size: 13px; color: #94a3b8; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }
    </style></head><body>
      <div class="container">
        <div class="header">PesaFlow</div>
        <div class="content">
          <h1>Application Status Update</h1>
          <p>Hello <strong>${userData.name}</strong>,</p>
          <p>Thank you for your interest in PesaFlow. At this time, your account registration request could not be approved by the administrator.</p>
          ${
            userData.reason
              ? `<div class="reason-box"><strong>Administrator Note:</strong> ${userData.reason}</div>`
              : ""
          }
          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">If you feel this decision was made in error, please contact the administrator directly.</p>
        </div>
        <div class="footer">
          <p>PesaFlow &bull; Personal Financial Management</p>
        </div>
      </div>
    </body></html>
  `,
});
