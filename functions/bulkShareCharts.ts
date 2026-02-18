import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chartIds, email, permission } = await req.json();

    if (!chartIds || !Array.isArray(chartIds) || chartIds.length === 0) {
      return Response.json({ error: 'Invalid chartIds' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!['view', 'edit'].includes(permission)) {
      return Response.json({ error: 'Invalid permission' }, { status: 400 });
    }

    // Update all charts with the new sharing info
    const results = await Promise.all(
      chartIds.map(async (chartId) => {
        const chart = await base44.entities.Chart.get(chartId);
        
        if (!chart) {
          return { chartId, success: false, error: 'Chart not found' };
        }

        // Check ownership
        if (chart.created_by !== user.email) {
          return { chartId, success: false, error: 'Not authorized' };
        }

        // Update shared_with
        const currentShared = chart.shared_with || [];
        const existingIndex = currentShared.findIndex(s => s.email === email);
        
        let updatedShared = currentShared;
        if (existingIndex >= 0) {
          // Update existing entry
          updatedShared[existingIndex] = { email, permission };
        } else {
          // Add new entry
          updatedShared = [...currentShared, { email, permission }];
        }

        await base44.entities.Chart.update(chartId, {
          shared_with: updatedShared
        });

        return { chartId, success: true };
      })
    );

    return Response.json({ results, email, permission });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});