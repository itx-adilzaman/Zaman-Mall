// Supabase Edge Function: send-welcome-email
// ─────────────────────────────────────────────────────────────────────────────
// Ye function Supabase Database Trigger se call hota hai
// jab bhi koi naya user signup karta hai.
// Resend API se branded welcome email bhejta hai.
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "Zaman Mall <welcome@zamansons.com>";

// ── Welcome Email HTML ────────────────────────────────────────────────────────
function getWelcomeEmailHTML(fullName: string, email: string): string {
  const firstName = fullName?.split(" ")[0] || "Valued Customer";

  return `<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Zaman Mall mein Khush Amdeed!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0a0a0a; color: #fff; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; }
    .header { text-align: center; padding: 48px 40px 40px; background: linear-gradient(135deg, #0f1f0f 0%, #0a0a0a 50%, #0d1a0d 100%); border-radius: 24px 24px 0 0; border: 1px solid #1a2e1a; border-bottom: none; position: relative; overflow: hidden; }
    .header::before { content: ''; position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%); border-radius: 50%; }
    .header::after { content: ''; position: absolute; bottom: -60px; left: -60px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(29,185,84,0.07) 0%, transparent 70%); border-radius: 50%; }
    .logo-ring { width: 88px; height: 88px; border-radius: 50%; border: 2px solid rgba(29,185,84,0.4); padding: 4px; background: rgba(29,185,84,0.06); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .logo-ring img { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; }
    .brand-name { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #fff; margin-bottom: 4px; }
    .brand-name span { color: #1DB954; }
    .brand-tagline { font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.35); }
    .card { background: #111; border: 1px solid #1e1e1e; border-top: none; padding: 48px 40px; }
    .welcome-badge { display: inline-block; background: rgba(29,185,84,0.1); border: 1px solid rgba(29,185,84,0.2); border-radius: 999px; padding: 6px 16px; font-size: 12px; font-weight: 700; color: #1DB954; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
    .greeting { font-size: 26px; font-weight: 900; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; }
    .greeting span { color: #1DB954; }
    .subtext { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.75; margin-bottom: 36px; }
    .divider { height: 1px; background: linear-gradient(to right, transparent, #2a2a2a, transparent); margin: 32px 0; }
    .features-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 32px; }
    .features-row { display: table-row; }
    .feature-item { display: table-cell; width: 50%; background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 12px; padding: 18px; text-align: center; vertical-align: top; }
    .feature-icon { font-size: 26px; margin-bottom: 8px; display: block; }
    .feature-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.8); margin-bottom: 4px; }
    .feature-desc { font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.5; }
    .btn-wrap { text-align: center; margin-bottom: 32px; }
    .btn { display: inline-block; padding: 16px 52px; background: linear-gradient(135deg, #1DB954 0%, #14a34a 100%); color: #000 !important; text-decoration: none; font-size: 15px; font-weight: 800; border-radius: 14px; box-shadow: 0 4px 24px rgba(29,185,84,0.35); }
    .info-box { background: rgba(255,255,255,0.02); border: 1px solid #222; border-radius: 14px; padding: 20px 24px; margin-bottom: 28px; }
    .info-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-row:first-child { padding-top: 0; }
    .info-icon { font-size: 15px; flex-shrink: 0; }
    .info-label { font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 600; flex: 1; }
    .info-value { font-size: 12px; color: rgba(255,255,255,0.65); font-weight: 700; }
    .footer { background: #0d0d0d; border: 1px solid #1a1a1a; border-top: none; border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center; }
    .footer-links { margin-bottom: 16px; }
    .footer-links a { color: rgba(255,255,255,0.25); text-decoration: none; font-size: 12px; font-weight: 600; margin: 0 12px; }
    .footer-copy { font-size: 11px; color: rgba(255,255,255,0.18); line-height: 1.7; }
    .footer-copy span { color: #1DB954; }
    .footer-copy strong { color: rgba(255,255,255,0.35); }
    @media (max-width: 480px) {
      .header, .card, .footer { padding-left: 24px; padding-right: 24px; }
      .features-grid { display: block; }
      .feature-item { display: block; width: 100%; margin-bottom: 10px; }
      .btn { padding: 14px 36px; }
      .greeting { font-size: 22px; }
    }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-ring">
      <img src="https://snbjqpuahjmigpftdwyo.supabase.co/storage/v1/object/public/assets/zaman-logo.png" alt="Zaman Mall" onerror="this.style.display='none'"/>
    </div>
    <div class="brand-name">Zaman <span>Mall</span></div>
    <div class="brand-tagline">Premium Shopping Experience</div>
  </div>

  <!-- CARD -->
  <div class="card">

    <div style="text-align:center; margin-bottom: 24px;">
      <span class="welcome-badge">🎉 New Member</span>
    </div>

    <h1 class="greeting" style="text-align:center;">
      Khush Amdeed, <span>${firstName}!</span>
    </h1>

    <p class="subtext" style="text-align:center;">
      Aapka Zaman Mall family mein swagat hai! 🛍️<br/>
      Pakistan ka #1 online shopping destination ab aapke haath mein hai.
    </p>

    <!-- Features Grid -->
    <table class="features-grid" cellpadding="0" cellspacing="10">
      <tr>
        <td class="feature-item">
          <span class="feature-icon">🛍️</span>
          <div class="feature-title">Hazar Products</div>
          <div class="feature-desc">Electronics, Fashion, Home aur bahut kuch</div>
        </td>
        <td class="feature-item">
          <span class="feature-icon">🚚</span>
          <div class="feature-title">Fast Delivery</div>
          <div class="feature-desc">Ghar tak safe aur jaldi delivery</div>
        </td>
      </tr>
      <tr>
        <td class="feature-item">
          <span class="feature-icon">💳</span>
          <div class="feature-title">Easy Payment</div>
          <div class="feature-desc">COD aur online dono available</div>
        </td>
        <td class="feature-item">
          <span class="feature-icon">🔒</span>
          <div class="feature-title">100% Secure</div>
          <div class="feature-desc">Aapki info aur payment bilkul safe</div>
        </td>
      </tr>
    </table>

    <div class="divider"></div>

    <!-- Account Info -->
    <div class="info-box">
      <div class="info-row">
        <div class="info-icon">📧</div>
        <div class="info-label">Account Email</div>
        <div class="info-value">${email}</div>
      </div>
      <div class="info-row">
        <div class="info-icon">👤</div>
        <div class="info-label">Naam</div>
        <div class="info-value">${fullName || firstName}</div>
      </div>
      <div class="info-row">
        <div class="info-icon">✅</div>
        <div class="info-label">Account Status</div>
        <div class="info-value" style="color:#1DB954;">Active</div>
      </div>
    </div>

    <!-- CTA -->
    <div class="btn-wrap">
      <a href="zaman-mall://(tabs)/" class="btn">
        🚀 &nbsp; Shopping Shuru Karein
      </a>
    </div>

    <p style="text-align:center; font-size:13px; color:rgba(255,255,255,0.3); line-height:1.7;">
      Koi masla ho toh hamare support se rabta karein.<br/>
      Hum hamesha aapki madad ke liye tayar hain. 🤝
    </p>

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-links">
      <a href="https://zamansons.com">Website</a>
      <a href="https://zamansons.com/privacy">Privacy Policy</a>
      <a href="https://zamansons.com/contact">Contact</a>
    </div>
    <p class="footer-copy">
      © 2025 <span>Zaman Sons Super Mall</span>. All rights reserved.<br/>
      Pakistan ka #1 Online Shopping Destination 🇵🇰<br/><br/>
      Ye email <strong>${email}</strong> ko bheja gaya hai.
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── Main Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();

    // Supabase webhook se aata hai: { type, record }
    const record = body?.record ?? body;
    const email: string = record?.email ?? "";
    const fullName: string =
      record?.raw_user_meta_data?.full_name ||
      record?.raw_user_meta_data?.name ||
      record?.full_name ||
      "";

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Resend se email bhejo
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "🎉 Zaman Mall mein Khush Amdeed! — Pakistan ka #1 Online Store",
        html: getWelcomeEmailHTML(fullName, email),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Email send failed", details: data }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
