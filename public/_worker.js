export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/submit-audit' && request.method === 'POST') {
      const body = await request.text();
      const headers = {};
      for (const [key, value] of request.headers.entries()) {
        const lk = key.toLowerCase();
        if (!lk.startsWith('cf-') && !lk.startsWith('x-forwarded') && lk !== 'host') {
          headers[key] = value;
        }
      }
      headers['Content-Type'] = 'application/json';
      
      try {
        const response = await fetch('http://5.9.81.5:3001/submit-audit', {
          method: 'POST',
          headers,
          body
        });
        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Qiyadon audit proxy', { status: 200 });
  }
};
