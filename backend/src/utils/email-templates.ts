/**
 * Email Template Generators
 * HTML templates for different email types
 */

/**
 * Order confirmation email template
 */
export function generateOrderConfirmationEmail(params: {
  customerName: string;
  orderNumber: string;
  total: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDeliveryDate?: string;
}): string {
  const itemsHtml = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Rs. ${item.price}</td>
    </tr>
  `,
    )
    .join("");

  const paymentMethodText = params.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .order-details { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #34495e; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #ddd; }
        .total-row { background-color: #ecf0f1; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
        .status-badge { display: inline-block; background-color: #3498db; color: white; padding: 8px 16px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Hi ${params.customerName},</p>
          <p>Thank you for your order! We're processing it right away.</p>

          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${params.orderNumber}</p>
            <p><strong>Status:</strong> <span class="status-badge">Pending Confirmation</span></p>
            <p><strong>Payment Method:</strong> ${paymentMethodText}</p>
            ${
              params.estimatedDeliveryDate
                ? `<p><strong>Estimated Delivery:</strong> ${params.estimatedDeliveryDate}</p>`
                : ""
            }
          </div>

          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align: right;">Total:</td>
                <td style="text-align: right;">Rs. ${params.total}</td>
              </tr>
            </tbody>
          </table>

          <h3>Delivery Address</h3>
          <p>${params.deliveryAddress}</p>

          <p style="margin-top: 30px; color: #7f8c8d;">
            You will receive another email once your order is shipped. 
            If you have any questions, please reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Home Business Automation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Order status update email template
 */
export function generateOrderStatusUpdateEmail(params: {
  customerName: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  statusMessage: string;
  trackingNumber?: string;
}): string {
  let statusEmoji = "📦";
  let statusColor = "#3498db";

  if (params.newStatus === "delivered") {
    statusEmoji = "✅";
    statusColor = "#27ae60";
  } else if (params.newStatus === "shipped") {
    statusEmoji = "🚚";
    statusColor = "#f39c12";
  } else if (params.newStatus === "cancelled" || params.newStatus === "refunded") {
    statusEmoji = "❌";
    statusColor = "#e74c3c";
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .status-update { background-color: ${statusColor}; color: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .status-emoji { font-size: 48px; margin-bottom: 10px; }
        .status-text { font-size: 24px; font-weight: bold; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Status Update</h1>
        </div>
        <div class="content">
          <p>Hi ${params.customerName},</p>
          <p>Your order has been updated!</p>

          <div class="status-update">
            <div class="status-emoji">${statusEmoji}</div>
            <div class="status-text">${params.newStatus.toUpperCase()}</div>
          </div>

          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${params.orderNumber}</p>
            <p><strong>Update:</strong> ${params.statusMessage}</p>
            ${
              params.trackingNumber
                ? `<p><strong>Tracking Number:</strong> <a href="https://track.example.com/${params.trackingNumber}">${params.trackingNumber}</a></p>`
                : ""
            }
          </div>

          <p style="margin-top: 30px; color: #7f8c8d;">
            If you have any questions about your order, please reply to this email or visit our website.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Home Business Automation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Payment verification email template
 */
export function generatePaymentVerifiedEmail(params: {
  customerName: string;
  orderNumber: string;
  amount: string;
  nextStep: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .success-badge { background-color: #27ae60; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Verified</h1>
        </div>
        <div class="content">
          <p>Hi ${params.customerName},</p>
          <p>Great news! Your payment has been verified and confirmed.</p>

          <div class="success-badge">
            <h2>Payment Confirmed</h2>
            <p>Amount: Rs. ${params.amount}</p>
            <p>Order: ${params.orderNumber}</p>
          </div>

          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Next Steps</h3>
            <p>${params.nextStep}</p>
          </div>

          <p style="margin-top: 30px; color: #7f8c8d;">
            You will receive email updates as your order progresses. Thank you for your business!
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Home Business Automation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Payment rejected email template
 */
export function generatePaymentRejectedEmail(params: {
  customerName: string;
  orderNumber: string;
  reason: string;
  nextStep: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
        .alert-badge { background-color: #e74c3c; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Issue</h1>
        </div>
        <div class="content">
          <p>Hi ${params.customerName},</p>
          <p>We encountered an issue with your payment slip verification.</p>

          <div class="alert-badge">
            <h2>Payment Rejected</h2>
            <p>Order: ${params.orderNumber}</p>
          </div>

          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Reason</h3>
            <p>${params.reason}</p>
            <h3>What to do next</h3>
            <p>${params.nextStep}</p>
          </div>

          <p style="margin-top: 30px; color: #7f8c8d;">
            If you have questions, please contact us or reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Home Business Automation. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
