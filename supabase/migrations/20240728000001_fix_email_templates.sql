-- Create email templates for Supabase Auth
-- Confirmation email
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>Confirm Your Email Address</h2>
      <p>Hi there,</p>
      <p>Thanks for signing up for UniShare! Please confirm your email address by clicking the button below:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
      </p>
      <p>This link will expire in 24 hours. If you didn''t create an account with us, you can safely ignore this email.</p>
      <p>Welcome to the UniShare community!</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>If you have any questions, please contact us at <span class="highlight">support@unishare.com</span></p>
    </div>
  </div>
</body>
</html>',
subject = 'Confirm Your UniShare Email'
WHERE template_type = 'confirmation';

-- Invite email
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You''ve Been Invited to UniShare</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>You''ve Been Invited!</h2>
      <p>Hello,</p>
      <p>You''ve been invited to join UniShare, the exclusive platform for university students to collaborate, share resources, and form study groups.</p>
      <p>Click the button below to accept your invitation and create your account:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Accept Invitation</a>
      </p>
      <p>This invitation will expire in 7 days. If you believe this was sent in error, you can safely ignore this email.</p>
      <p>We''re excited to have you join our academic community!</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>If you have any questions, please contact us at <span class="highlight">support@unishare.com</span></p>
    </div>
  </div>
</body>
</html>',
subject = 'You''ve Been Invited to UniShare'
WHERE template_type = 'invite';

-- Recovery (reset password) email
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
    .warning {
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      padding: 10px 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your UniShare account. Click the button below to create a new password:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      </p>
      <div class="warning">
        <p><strong>Important:</strong> If you didn''t request a password reset, please ignore this email or contact support immediately.</p>
      </div>
      <p>This link will expire in 60 minutes for security reasons.</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>If you have any questions, please contact us at <span class="highlight">support@unishare.com</span></p>
    </div>
  </div>
</body>
</html>',
subject = 'Reset Your UniShare Password'
WHERE template_type = 'recovery';

-- Magic link email
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Magic Link</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
    .security-note {
      font-size: 13px;
      color: #666;
      font-style: italic;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>Your Magic Link</h2>
      <p>Hello,</p>
      <p>Here''s your magic link to sign in to UniShare. Click the button below to securely sign in to your account:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Sign In to UniShare</a>
      </p>
      <p>This link will expire in 10 minutes and can only be used once.</p>
      <p class="security-note">For security reasons, we recommend closing this email after you''ve signed in.</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>If you didn''t request this link or need assistance, please contact <span class="highlight">support@unishare.com</span></p>
    </div>
  </div>
</body>
</html>',
subject = 'Your Magic Link for UniShare'
WHERE template_type = 'magic_link';

-- Email change email (old address)
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Email Change Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .alert {
      background-color: #fff8e6;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>Email Change Notification</h2>
      <p>Hello,</p>
      <p>We''re contacting you to let you know that a request has been made to change the email address associated with your UniShare account.</p>
      <div class="alert">
        <p><strong>Important:</strong> Your email is being changed from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>
      </div>
      <p>If you requested this change, no further action is needed. The change will be completed shortly.</p>
      <p>If you did NOT request this change, please contact our support team immediately at <span class="highlight">support@unishare.com</span>.</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>For security reasons, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
subject = 'Your UniShare Email Address is Being Changed'
WHERE template_type = 'email_change_old';

-- Email change email (new address)
UPDATE auth.templates
SET template = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm Your New Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      padding: 20px;
      border-top: 1px solid #eaeaea;
    }
    .highlight {
      color: #4f46e5;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>UniShare</h1>
    </div>
    <div class="content">
      <h2>Confirm Your New Email Address</h2>
      <p>Hello,</p>
      <p>We received a request to change the email address for your UniShare account from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>
      <p>To complete this change, please click the button below to confirm your new email address:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
      </p>
      <p>This link will expire in 24 hours. If you didn''t request this change, you can safely ignore this email, and your account will continue to use your current email address.</p>
    </div>
    <div class="footer">
      <p>© 2024 UniShare. All rights reserved.</p>
      <p>If you have any questions, please contact us at <span class="highlight">support@unishare.com</span></p>
    </div>
  </div>
</body>
</html>',
subject = 'Confirm Your New UniShare Email Address'
WHERE template_type = 'email_change_new';

-- SMS OTP template
UPDATE auth.sms_templates
SET template = 'Your UniShare verification code is: {{ .Code }}'
WHERE template_type = 'sms_otp';

-- Phone change template
UPDATE auth.sms_templates
SET template = 'Your UniShare phone change code is: {{ .Code }}'
WHERE template_type = 'phone_change';

-- SMS confirmation template
UPDATE auth.sms_templates
SET template = 'Your UniShare confirmation code is: {{ .Code }}'
WHERE template_type = 'sms_confirmation';
