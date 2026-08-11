// Vercel Edge Function — receives the contact form's FormData directly
// (no client-side JSON conversion needed, and Edge's native
// `Request.formData()` parses multipart/form-data, including the file
// attachment, without extra dependencies) and relays it as an email via
// Resend's HTTP API.
//
// Edge runtime (not the default Node runtime) specifically because it
// gives us the standard Fetch API's `Request`/`FormData`/`File`, which is
// what the Contact form on the client already builds — a Node serverless
// function would need a separate multipart-parsing library (formidable/
// busboy) to get the same thing.
//
// Required environment variables (set in the Vercel project's dashboard,
// not committed here):
//   RESEND_API_KEY   - from https://resend.com/api-keys
//   CONTACT_TO_EMAIL - inbox that should receive submissions (defaults to
//                      Sales@uspanels.com, matching src/data/site.js)
//   CONTACT_FROM_EMAIL - the "from" address Resend sends as; MUST be on a
//                      domain verified in the Resend dashboard (Resend
//                      rejects sends from unverified domains) — falls
//                      back to Resend's own shared onboarding@resend.dev
//                      sender if unset, which works immediately but is
//                      only meant for testing, not real production mail.
export const config = { runtime: "edge" };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Mirrors validateForm in src/utils/validation.js — re-checked here
// because this endpoint can be hit directly (not just through the form's
// own client-side validation), so it can't trust the client at all.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Server misconfiguration, not the visitor's fault — logged so it
    // shows up in Vercel's function logs, but the visitor just sees a
    // generic failure (handled by the client's catch block).
    console.error("contact form: RESEND_API_KEY is not set");
    return new Response(JSON.stringify({ error: "Server is not configured to send email yet." }), { status: 500 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Could not read the submitted form." }), { status: 400 });
  }

  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";
  const attachment = formData.get("attachment");
  const hasAttachment = attachment && typeof attachment === "object" && "size" in attachment && attachment.size > 0;

  const errors = {};
  if (!name) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";
  if (!phone) errors.phone = "Phone number is required.";
  else if (phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a valid phone number.";
  if (hasAttachment && attachment.size > MAX_ATTACHMENT_BYTES) {
    errors.attachment = "File is too large, please attach something under 10MB.";
  }
  if (Object.keys(errors).length > 0) {
    return new Response(JSON.stringify({ errors }), { status: 422 });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL || "Sales@uspanels.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "US Panels Website <onboarding@resend.dev>";

  const payload = {
    from: fromEmail,
    to: [toEmail],
    reply_to: email,
    subject: `New inquiry from ${name} (US Panels website)`,
    html: `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Message:</strong></p>
      <p>${message ? escapeHtml(message).replace(/\n/g, "<br>") : "<em>No message provided.</em>"}</p>
    `,
  };

  if (hasAttachment) {
    // Resend's attachments take base64 content directly — no upload step,
    // no temp storage needed, the whole file just rides along in the same
    // request body Edge already parsed above. Built with btoa/
    // String.fromCharCode rather than Node's Buffer — the Edge runtime is
    // a V8 isolate, not Node, so Buffer isn't available here.
    const bytes = new Uint8Array(await attachment.arrayBuffer());
    let binary = "";
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    payload.attachments = [{ filename: attachment.name || "attachment", content: btoa(binary) }];
  }

  let resendResponse;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("contact form: network error calling Resend", err);
    return new Response(JSON.stringify({ error: "Could not reach the email service. Please try again." }), { status: 502 });
  }

  if (!resendResponse.ok) {
    const detail = await resendResponse.text().catch(() => "");
    console.error("contact form: Resend rejected the request", resendResponse.status, detail);
    return new Response(JSON.stringify({ error: "The email service rejected the message. Please try again." }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
