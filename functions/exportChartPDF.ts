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
    const allSections = await base44.entities.Section.filter({ chart_id });

    if (!chart) {
      return Response.json({ error: 'Chart not found' }, { status: 404 });
    }

    // Order sections by chart.sections array to maintain correct order
    const sections = chart.sections && chart.sections.length > 0
      ? chart.sections.map(sectionId => allSections.find(s => s.id === sectionId)).filter(Boolean)
      : allSections;

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const columnGap = 8;
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
      yPosition += 7;
    }

    // Chart Info
    doc.setFontSize(10);
    doc.text(`Key: ${chart.key}    Time: ${chart.time_signature}`, margin, yPosition);
    yPosition += 10;

    // Column dimensions
    const columnWidth = (pageWidth - 2 * margin - columnGap) / 2;
    const measuresPerRow = 4;
    const cellWidth = columnWidth / measuresPerRow;
    const cellHeight = 12;

    // Render sections in 2-column layout
    let leftX = margin;
    let rightX = margin + columnWidth + columnGap;
    let currentY = yPosition;
    let rightY = yPosition;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const isLeftColumn = i % 2 === 0;
      const x = isLeftColumn ? leftX : rightX;
      let y = isLeftColumn ? currentY : rightY;

      // Calculate space needed for this section
      const numRows = Math.ceil(section.measures.length / measuresPerRow);
      const sectionHeight = 6 + (section.arrangement_cue ? 4 : 0) + (numRows * cellHeight) + 8;

      // Check if we need a new page
      if (y + sectionHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        rightY = margin;
        y = isLeftColumn ? currentY : rightY;
      }

      // Section Header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      const sectionLabel = section.repeat_count > 1 
        ? `${section.label.toUpperCase()} x${section.repeat_count}`
        : section.label.toUpperCase();
      doc.text(sectionLabel, x, y);
      y += 6;

      if (section.arrangement_cue) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(section.arrangement_cue, x, y);
        y += 4;
      }

      // Measures Grid
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      for (let i = 0; i < section.measures.length; i++) {
        const measure = section.measures[i];
        const col = i % measuresPerRow;
        const row = Math.floor(i / measuresPerRow);
        
        const mx = x + col * cellWidth;
        const my = y + row * cellHeight;

        // Draw cell border
        doc.rect(mx, my, cellWidth, cellHeight);

        // Draw chords
        if (measure.chords && measure.chords.length > 0) {
          const chordText = measure.chords.map(c => c.chord).join(' ');
          doc.text(chordText, mx + 1.5, my + cellHeight / 2 + 1.5, { maxWidth: cellWidth - 3, fontSize: 10 });
        }

        // Draw cue if present
        if (measure.cue) {
          doc.setFontSize(7);
          doc.text(measure.cue, mx + 1.5, my + cellHeight - 1, { maxWidth: cellWidth - 3 });
          doc.setFontSize(10);
        }
      }

      y += numRows * cellHeight + 8;

      if (isLeftColumn) {
        currentY = y;
      } else {
        rightY = y;
        // Move to next row of sections when right column is done
        if (i < sections.length - 1) {
          currentY = Math.max(currentY, rightY);
          rightY = currentY;
        }
      }
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