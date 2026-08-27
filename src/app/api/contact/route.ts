import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, orderNumber, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    // Save to DB
    const ticket = await prisma.supportTicket.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        orderNumber: orderNumber?.trim() || null,
        message: message.trim(),
        status: 'OPEN',
      },
    });

    // Basic rate limiting: prevent same email spamming >5 tickets per hour
    const recentCount = await prisma.supportTicket.count({
      where: { email: email.trim().toLowerCase(), createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recentCount >= 5) {
      return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }

    // Sanitize to prevent XSS in email HTML
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeName = esc(name.trim());
    const safeEmail = esc(email.trim());
    const safeMsg = esc(message.trim()).replace(/\n/g, '<br />');
    const safeOrder = orderNumber ? esc(orderNumber.trim()) : '';

    // Send notification email to support
    try {
      await sendEmail({
        to: 'support@bagifyyyy.com',
        subject: `[Support] New ticket from ${safeName}${safeOrder ? ` — Order #${safeOrder}` : ''}`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f5e9;">
            <h2 style="font-family: sans-serif; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #232D3B;">
              NEW SUPPORT TICKET
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr><td style="padding: 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; width: 120px;">Ticket ID</td><td style="padding: 8px 0; font-weight: bold; color: #232D3B;">#${esc(ticket.id.slice(0, 8).toUpperCase())}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Name</td><td style="padding: 8px 0; font-weight: bold; color: #232D3B;">${safeName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #232D3B;">${safeEmail}</a></td></tr>
              ${safeOrder ? `<tr><td style="padding: 8px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">Order #</td><td style="padding: 8px 0; font-weight: bold; color: #232D3B;">${safeOrder}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px; padding: 16px; background: white; border-left: 4px solid #232D3B;">
              <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">Message</p>
              <p style="color: #232D3B; line-height: 1.6; margin: 0;">${safeMsg}</p>
            </div>
            <p style="margin-top: 24px; font-size: 11px; color: #999;">Reply directly to this email to respond to the customer.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Non-fatal — ticket is saved even if email fails
      console.warn('Support email notification failed:', emailErr);
    }

    // Send auto-reply to customer
    try {
      await sendEmail({
        to: email,
        subject: `We received your message — BAGIFYYYY Support`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f5e9;">
            <h2 style="font-family: sans-serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #232D3B;">
              MESSAGE RECEIVED ✦
            </h2>
            <p style="color: #232D3B; line-height: 1.7; margin-top: 12px;">
              Hey ${safeName},<br /><br />
              We've received your message and our team will get back to you within 24 hours (Mon–Sat, 10am–6pm IST).<br /><br />
              For the fastest response, DM us on <a href="https://instagram.com/bagifyyyy" style="color: #232D3B; font-weight: bold;">@bagifyyyy</a>.
            </p>
            <div style="margin-top: 20px; padding: 16px; background: white; border-left: 4px solid #232D3B; font-size: 12px; color: #666;">
              <b style="color: #232D3B; text-transform: uppercase; letter-spacing: 0.08em;">Your message:</b><br /><br />
              ${safeMsg}
            </div>
            <p style="margin-top: 24px; font-size: 11px; color: #999;">BAGIFYYYY — Premium Y2K Archive Streetwear</p>
          </div>
        `,
      });
    } catch (autoReplyErr) {
      console.warn('Auto-reply email failed:', autoReplyErr);
    }

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to submit your message.' }, { status: 500 });
  }
}
