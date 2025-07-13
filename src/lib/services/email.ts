import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Jivunie SACCO" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Jivunie SACCO!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining Jivunie SACCO. To complete your registration and start using our services, 
            please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #10B981, #3B82F6); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${verificationUrl}" style="color: #3B82F6;">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't create an account with Jivunie SACCO, please ignore this email.
          </p>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 Jivunie SACCO. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your Jivunie SACCO account',
      html,
      text: `Welcome to Jivunie SACCO! Please verify your email by visiting: ${verificationUrl}`,
    });
  }

  async sendLoanApprovalEmail(email: string, fullName: string, amount: number): Promise<boolean> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Loan Approved!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333;">Congratulations ${fullName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            We're pleased to inform you that your loan application has been approved.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #10B981; margin-top: 0;">Loan Details:</h3>
            <p><strong>Approved Amount:</strong> KSh ${amount.toLocaleString()}</p>
            <p><strong>Status:</strong> Approved</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            The funds will be disbursed to your account within 24 hours. You'll receive another 
            email with payment schedule details.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/loans" 
               style="background: linear-gradient(135deg, #10B981, #3B82F6); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;">
              View Loan Details
            </a>
          </div>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 Jivunie SACCO. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Loan Application Approved - Jivunie SACCO',
      html,
    });
  }
}

export const emailService = new EmailService();