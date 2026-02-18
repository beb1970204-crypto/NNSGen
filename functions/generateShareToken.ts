import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chartId } = await req.json();

    if (!chartId) {
      return Response.json({ error: 'Missing chartId' }, { status: 400 });
    }

    const chart = await base44.entities.Chart.get(chartId);

    if (!chart) {
      return Response.json({ error: 'Chart not found' }, { status: 404 });
    }

    if (chart.created_by !== user.email) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Generate new token if doesn't exist
    const token = chart.share_token || generateToken();

    if (!chart.share_token) {
      await base44.entities.Chart.update(chartId, { share_token: token });
    }

    return Response.json({ token, chartId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});