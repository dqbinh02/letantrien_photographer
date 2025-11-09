import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Gallery';

  // Create a simple OG image with the title
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
          }
          .title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            max-width: 80%;
            line-height: 1.2;
          }
          .subtitle {
            font-size: 24px;
            opacity: 0.9;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 18px;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <div class="title">${title}</div>
        <div class="subtitle">Photo Gallery</div>
        <div class="logo">Letantrien Photographer</div>
      </body>
    </html>
  `;

  // For now, return HTML. In production, you'd use a library like @vercel/og or puppeteer
  // to generate actual images. This is a placeholder that returns HTML for the OG image.

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}