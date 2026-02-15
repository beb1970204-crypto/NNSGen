import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chart_id } = await req.json();

    if (!chart_id) {
      return Response.json({ error: 'Chart ID is required' }, { status: 400 });
    }

    // Fetch chart and sections
    const chart = await base44.entities.Chart.get(chart_id);
    const sections = await base44.entities.Section.filter({ chart_id });

    if (!chart) {
      return Response.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(chart.title, margin, yPosition);
    yPosition += 10;

    if (chart.artist) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(chart.artist, margin, yPosition);
      yPosition += 8;
    }

    // Chart Info
    doc.setFontSize(10);
    doc.text(`Key: ${chart.key}    Time: ${chart.time_signature}`, margin, yPosition);
    yPosition += 10;

    // Sections
    for (const section of sections) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Section Header
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      const sectionLabel = section.repeat_count > 1 
        ? `${section.label.toUpperCase()} x${section.repeat_count}`
        : section.label.toUpperCase();
      doc.text(sectionLabel, margin, yPosition);
      yPosition += 6;

      if (section.arrangement_cue) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.text(section.arrangement_cue, margin, yPosition);
        yPosition += 5;
      }

      // Measures Grid - 4 measures per row
      const measuresPerRow = 4;
      const cellWidth = (pageWidth - 2 * margin) / measuresPerRow;
      const cellHeight = 15;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);

      for (let i = 0; i < section.measures.length; i++) {
        const measure = section.measures[i];
        const col = i % measuresPerRow;
        const row = Math.floor(i / measuresPerRow);
        
        const x = margin + col * cellWidth;
        const y = yPosition + row * cellHeight;

        // Draw cell border
        doc.rect(x, y, cellWidth, cellHeight);

        // Draw chords
        if (measure.chords && measure.chords.length > 0) {
          const chordText = measure.chords.map(c => c.chord).join(' ');
          doc.text(chordText, x + 2, y + cellHeight / 2 + 2, { maxWidth: cellWidth - 4 });
        }

        // Draw cue if present
        if (measure.cue) {
          doc.setFontSize(8);
          doc.text(measure.cue, x + 2, y + cellHeight - 2, { maxWidth: cellWidth - 4 });
          doc.setFontSize(11);
        }
      }

      yPosition += Math.ceil(section.measures.length / measuresPerRow) * cellHeight + 10;
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${chart.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});