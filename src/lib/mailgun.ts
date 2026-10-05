import { escapeHtml } from "./checkout-helpers";
import { formatMoney } from "./money";
import { orderItemsToText } from "./orders";
import type { OrderRecord } from "./types";

/**
 * Sends email through Mailgun's HTTP API.
 *
 * We use plain `fetch` rather than the Mailgun SDK: one less dependency, and
 * you can see exactly what is being sent.
 *
 * Docs: https://documentation.mailgun.com/docs/mailgun/api-reference/
 *
 * IMPORTANT: Mailgun's free sandbox domain only delivers to addresses you add
 * under "Authorized recipients" in the Mailgun dashboard. Add your own address
 * there or the demo will look broken.
 *
 * TO CHANGE THE SENDER NAME: edit MAILGUN_FROM in .env.local, for example
 *   MAILGUN_FROM=Ruby Debby Fashion Home <orders@yourdomain.com>
 */

export function isMailgunConfigured(): boolean {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

function mailgunBaseUrl(): string {
  // Mailgun runs separate clusters for US and EU accounts.
  const host =
    process.env.MAILGUN_REGION?.toLowerCase() === "eu"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";
  return `${host}/v3/${process.env.MAILGUN_DOMAIN}`;
}

export type MailResult = {
  sent: boolean;
  /** True when Mailgun is not configured, so we only printed the email. */
  demo: boolean;
  error?: string;
};

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<MailResult> {
  if (!isMailgunConfigured()) {
    console.log(
      `\n[demo email] MAILGUN_API_KEY / MAILGUN_DOMAIN are not set, so no email was sent.\n` +
        `To: ${options.to}\nSubject: ${options.subject}\n\n${options.text}\n`,
    );
    return { sent: false, demo: true };
  }

  const apiKey = process.env.MAILGUN_API_KEY as string;
  const from =
    process.env.MAILGUN_FROM ??
    `Ruby Debby Fashion Home <postmaster@${process.env.MAILGUN_DOMAIN}>`;

  const body = new URLSearchParams({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  try {
    const response = await fetch(`${mailgunBaseUrl()}/messages`, {
      method: "POST",
      headers: {
        // Mailgun authenticates with HTTP Basic auth; the username is
        // literally the word "api" and the password is your private key.
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(`[mailgun] ${response.status}: ${detail}`);
      return {
        sent: false,
        demo: false,
        error: `Mailgun replied with ${response.status}. Check the API key, the domain and the region.`,
      };
    }

    return { sent: true, demo: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[mailgun] ${message}`);
    return { sent: false, demo: false, error: message };
  }
}

/* ------------------------------------------------------------------ */
/*  The email templates                                                */
/* ------------------------------------------------------------------ */

/** One table row per item in the order. */
function orderRowsHtml(order: OrderRecord): string {
  return order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">
            ${escapeHtml(item.productName)}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">
            ${item.quantity}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">
            ${formatMoney(item.unitPriceCents * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");
}

function totalsRow(label: string, value: string, bold = false): string {
  const weight = bold ? "font-weight:700;" : "";
  return `
        <tr>
          <td colspan="2" style="padding:8px 12px;text-align:right;${weight}">${label}</td>
          <td style="padding:8px 12px;text-align:right;${weight}">${value}</td>
        </tr>`;
}

/**
 * Email clients are stuck in 2005: no external stylesheets, no flexbox, and
 * inconsistent CSS. Inline styles on a simple table is the format that works
 * everywhere.
 */
function wrapHtml(order: OrderRecord, intro: string): string {
  const delivery =
    order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents);

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <h1 style="font-size:20px;margin:0 0 4px">Ruby Debby Fashion Home</h1>
    <p style="color:#8a1538;font-weight:600;margin:0 0 16px">Order ${escapeHtml(order.orderNumber)}</p>
    <p>${intro}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead>
        <tr style="background:#fdf2f5">
          <th style="padding:8px 12px;text-align:left">Item</th>
          <th style="padding:8px 12px;text-align:center">Qty</th>
          <th style="padding:8px 12px;text-align:right">Price</th>
        </tr>
      </thead>
      <tbody>${orderRowsHtml(order)}</tbody>
      <tfoot>
        ${totalsRow("Subtotal", formatMoney(order.subtotalCents))}
        ${totalsRow("Delivery", delivery)}
        ${totalsRow("Total", formatMoney(order.totalCents), true)}
      </tfoot>
    </table>
    <p style="color:#6b7280;font-size:14px;line-height:1.6">
      Delivering to:<br />
      ${escapeHtml(order.customerName)}<br />
      ${escapeHtml(order.shippingAddress)}<br />
      ${escapeHtml(order.city)}${order.shippingState ? `, ${escapeHtml(order.shippingState)}` : ""}<br />
      ${escapeHtml(order.postcode)}<br />
      ${escapeHtml(order.country)}
      ${order.customerPhone ? `<br />Phone: ${escapeHtml(order.customerPhone)}` : ""}
    </p>
    <p style="color:#9ca3af;font-size:12px;border-top:1px solid #eee;padding-top:12px">
      Thanks for shopping with Ruby Debby Fashion Home.
    </p>
  </div>`;
}

/** The customer's receipt. */
export async function sendOrderConfirmationEmail(
  order: OrderRecord,
): Promise<MailResult> {
  return sendMail({
    to: order.customerEmail,
    subject: `Your Ruby Debby order ${order.orderNumber} is confirmed`,
    text: `Thank you for shopping with Ruby Debby Fashion Home!\n\n${orderItemsToText(order)}\n\nWe will email you again when your parcel is on its way.`,
    html: wrapHtml(
      order,
      "Thank you for your order - here is your receipt. We will email you again when your parcel is on its way.",
    ),
  });
}

/** A heads-up to the shop owner. Skipped quietly when no address is set. */
export async function sendNewOrderNotification(
  order: OrderRecord,
): Promise<MailResult | null> {
  const to = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!to) return null;

  return sendMail({
    to,
    subject: `New order ${order.orderNumber} - ${formatMoney(order.totalCents)}`,
    text: `New order from ${order.customerName} <${order.customerEmail}>.\n\n${orderItemsToText(order)}`,
    html: wrapHtml(
      order,
      `New order from <strong>${escapeHtml(order.customerName)}</strong> (${escapeHtml(order.customerEmail)}).`,
    ),
  });
}