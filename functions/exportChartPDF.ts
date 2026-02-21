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
    const cellHeight = 11;
    const sectionSpacing = 2;

    // Render sections in 2-column layout
    let leftX = margin;
    let rightX = margin + columnWidth + columnGap;
    let leftY = yPosition;
    let rightY = yPosition;

    // Fill left column top-to-bottom, then right column top-to-bottom
    // Switch to right column once left overflows; new page once right overflows
    let onRightColumn = false;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const numRows = Math.ceil(section.measures.length / measuresPerRow);
      const sectionHeight = 6 + (section.arrangement_cue ? 4.5 : 0) + (numRows * cellHeight);

      let x = onRightColumn ? rightX : leftX;
      let y = onRightColumn ? rightY : leftY;

      // Check if section fits in current column
      if (y + sectionHeight > pageHeight - margin) {
        if (!onRightColumn) {
          // Overflow left → switch to right column
          onRightColumn = true;
          x = rightX;
          y = rightY;
        }
        // Right column also full → new page
        if (y + sectionHeight > pageHeight - margin) {
          doc.addPage();
          leftY = margin;
          rightY = margin;
          onRightColumn = false;
          x = leftX;
          y = margin;
        }
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
        y += 4.5;
      }

      // Measures Grid
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);

      for (let j = 0; j < section.measures.length; j++) {
        const measure = section.measures[j];
        const col = j % measuresPerRow;
        const row = Math.floor(j / measuresPerRow);
        
        const mx = x + col * cellWidth;
        const my = y + row * cellHeight;

        // Draw cell border
        doc.rect(mx, my, cellWidth, cellHeight);

        // Draw chords — proportional beat widths for multi-chord measures
        if (measure.chords && measure.chords.length > 0) {
          const chords = measure.chords;
          const centerY = my + cellHeight / 2 + 0.5;
          if (chords.length === 1) {
            doc.setFontSize(9);
            doc.text(chords[0].chord || '-', mx + cellWidth / 2, centerY, { align: 'center', maxWidth: cellWidth - 2 });
          } else {
            const totalBeats = chords.reduce((s, c) => s + (c.beats || 4), 0);
            let slotX = mx;
            chords.forEach((chordObj, ci) => {
              const slotW = ((chordObj.beats || 4) / totalBeats) * cellWidth;
              doc.setFontSize(7);
              doc.text(chordObj.chord || '-', slotX + slotW / 2, centerY, { align: 'center', maxWidth: slotW - 1 });
              // Divider between chords
              if (ci < chords.length - 1) {
                doc.setDrawColor(180, 180, 180);
                doc.line(slotX + slotW, my + 1.5, slotX + slotW, my + cellHeight - 1.5);
                doc.setDrawColor(0, 0, 0);
              }
              slotX += slotW;
            });
            doc.setFontSize(9);
          }
        }

        // Draw cue if present
        if (measure.cue) {
          doc.setFontSize(7);
          doc.text(measure.cue, mx + 1, my + cellHeight - 1.5, { maxWidth: cellWidth - 2 });
          doc.setFontSize(9);
        }
      }

      y += numRows * cellHeight + sectionSpacing + 2;

      if (onRightColumn) {
        rightY = y;
      } else {
        leftY = y;
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