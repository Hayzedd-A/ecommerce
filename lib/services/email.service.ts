/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { formatCurrency } from "../utils/formatters";

// Set up transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const fromAddress = process.env.EMAIL_FROM || '"E-Commerce Store" <no-reply@example.com>';

export class EmailService {
  /**
   * Helper to send HTML emails
   */
  private static async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    // If SMTP is not fully configured, log and gracefully return
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn(`⚠️ SMTP Credentials missing. Logging email instead:\nTo: ${to}\nSubject: ${subject}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send Password Reset link
   */
  static async sendForgotPassword(email: string, name: string, resetLink: string): Promise<boolean> {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to secure your account and choose a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.875rem;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendMail(email, "Reset Your Password", html);
  }

  /**
   * Send Order Confirmation Email
   */
  static async sendOrderConfirmation(email: string, name: string, order: any): Promise<boolean> {
    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <div><strong>${item.name}</strong></div>
          <div style="color: #64748b; font-size: 0.875rem;">Qty: ${item.quantity}</div>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `
      )
      .join("");

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #10b981; margin: 0;">Order Confirmed!</h2>
          <p style="color: #64748b; margin: 5px 0 0 0;">Thank you for shopping with us.</p>
        </div>
        
        <p>Hello ${name},</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been received and is being processed.</p>
        
        <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 30px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="color: #64748b; font-size: 0.875rem; text-align: left;">
              <th style="padding-bottom: 10px; border-bottom: 1px solid #cbd5e1;">Item</th>
              <th style="padding-bottom: 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="color: #64748b;">Subtotal</td>
            <td style="text-align: right;">${formatCurrency(order.subtotal)}</td>
          </tr>
          ${
            order.deliveryFee > 0
              ? `<tr>
            <td style="color: #64748b;">Delivery Fee</td>
            <td style="text-align: right;">${formatCurrency(order.deliveryFee)}</td>
          </tr>`
              : ""
          }
          ${
            order.discount > 0
              ? `<tr style="color: #10b981;">
            <td>Discount</td>
            <td style="text-align: right;">-${formatCurrency(order.discount)}</td>
          </tr>`
              : ""
          }
          <tr style="font-size: 1.125rem; font-weight: bold;">
            <td style="padding-top: 10px; border-top: 2px solid #cbd5e1;">Total</td>
            <td style="padding-top: 10px; border-top: 2px solid #cbd5e1; text-align: right;">${formatCurrency(
              order.total
            )}</td>
          </tr>
        </table>

        <div style="margin-top: 30px; background-color: #f8fafc; padding: 15px; border-radius: 6px; font-size: 0.875rem;">
          <strong>Shipping Details:</strong><br>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.phone}<br>
          ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}
        </div>
      </div>
    `;

    return this.sendMail(email, `Order Confirmation - ${order.orderNumber}`, html);
  }

  /**
   * Send Order Status Update Email
   */
  static async sendOrderStatusUpdate(
    email: string,
    name: string,
    orderNumber: string,
    newStatus: string
  ): Promise<boolean> {
    const statusMap: Record<string, string> = {
      pending_payment: "Pending Payment",
      paid: "Paid & Confirmed",
      processing: "Processing",
      ready_for_pickup: "Ready for Pickup",
      completed: "Delivered & Completed",
      cancelled: "Cancelled",
    };

    const statusName = statusMap[newStatus] || newStatus;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">Order Status Updated</h2>
        <p>Hello ${name},</p>
        <p>The status of your order <strong>${orderNumber}</strong> has been updated to:</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; font-size: 1.25rem; font-weight: bold; color: #1e293b;">
          ${statusName}
        </div>
        <p>You can check the current status and tracking details in your account dashboard anytime.</p>
        <p style="color: #64748b; font-size: 0.875rem;">If you have any questions, please reply to this email.</p>
      </div>
    `;

    return this.sendMail(email, `Order Status Update - ${orderNumber}`, html);
  }
}
