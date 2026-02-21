import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
import { Chord, distance, Note } from 'npm:tonal@6.0.1';

const INTERVAL_TO_ROMAN = {
  '1P': 'I',   'P1': 'I',
  '2m': '♭II', 'm2': '♭II',
  '2M': 'II',  'M2': 'II',
  '3m': '♭III','m3': '♭III',
  '3M': 'III', 'M3': 'III',
  '4P': 'IV',  'P4': 'IV',
  '4A': '♯IV', 'A4': '♯IV',
  '5d': '♭V',  'd5': '♭V',
  '5P': 'V',   'P5': 'V',
  '6m': '♭VI', 'm6': '♭VI',
  '6M': 'VI',  'M6': 'VI',
  '7m': '♭VII','m7': '♭VII',
  '7M': 'VII', 'M7': 'VII'
};

function getScaleDegreeInterval(chord, chartKey) {
  const chordData = Chord.get(chord);
  if (!chordData || chordData.empty) return null;

  const keyRoot = chartKey.replace(/m$/, '');
  const tonic = Note.get(chordData.tonic).pc || chordData.tonic;
  const interval = distance(keyRoot, tonic);

  return { chordData, interval };
}

function extractBass(chord, root) {
  const afterRoot = chord.slice(root.length);
  const slashIdx = afterRoot.indexOf('/');
  if (slashIdx === -1) return { suffix: afterRoot, bass: '' };
  return {
    suffix: afterRoot.slice(0, slashIdx),
    bass: '/' + afterRoot.slice(slashIdx + 1)
  };
}

function chordToRoman(chord, chartKey) {
  if (!chord || chord === '-') return '-';

  const result = getScaleDegreeInterval(chord, chartKey);
  if (!result) return chord;

  const { chordData, interval } = result;
  if (!interval) return chord;

  let roman = INTERVAL_TO_ROMAN[interval] || '?';
  const { suffix, bass } = extractBass(chord, chordData.tonic);

  let qualitySuffix = suffix;

  if (qualitySuffix.startsWith('m') && !qualitySuffix.startsWith('maj')) {
    roman = roman.toLowerCase();
    qualitySuffix = qualitySuffix.slice(1);
  }

  const quality = chordData.quality.toLowerCase();
  if (quality.includes('dim')) {
    roman = roman.toLowerCase() + '°';
    qualitySuffix = qualitySuffix.replace(/^dim/, '');
  } else if (quality.includes('aug')) {
    roman += '+';
    qualitySuffix = qualitySuffix.replace(/^aug/, '');
  }

  return roman + qualitySuffix + bass;
}

// Sanitize Unicode music symbols that fall outside jsPDF's Latin-1 (Windows-1252) font encoding
function sanitizePDFStr(str) {
  return str
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/△/g, '^'); // △ (U+25B3) not in Latin-1; ^ is the standard ASCII maj7 symbol
}

// Split a converted chord string into base text and superscript suffix
function splitChordSuffix(str) {
  const s = sanitizePDFStr(str);
  const slashIdx = s.indexOf('/');
  const basePart = slashIdx !== -1 ? s.slice(0, slashIdx) : s;
  const bassSuffix = slashIdx !== -1 ? s.slice(slashIdx) : '';

  if (basePart.endsWith('maj7'))  return { base: basePart.slice(0, -4) + bassSuffix, sup: '^' };   // maj7
  if (basePart.endsWith('-7'))    return { base: basePart.slice(0, -2) + bassSuffix, sup: '-7' };   // minor 7 (NNS)
  if (basePart.endsWith('\u00b07')) return { base: basePart.slice(0, -2) + bassSuffix, sup: 'o7' }; // dim7 (°7)
  if (basePart.endsWith('7')) {
    const before = basePart.slice(0, -1);
    if (/[a-z]$/.test(before)) return { base: before + bassSuffix, sup: '-7' }; // minor 7 (roman: vi7)
    return { base: before + bassSuffix, sup: '7' };                              // dominant 7
  }
  if (basePart.endsWith('\u00b0')) return { base: basePart.slice(0, -1) + bassSuffix, sup: 'o' };   // dim (°)
  if (basePart.endsWith('+'))     return { base: basePart.slice(0, -1) + bassSuffix, sup: '+' };    // aug
  return { base: s, sup: null };
}

// Draw a single chord string with superscript notation, centered at (cx, cy)
function drawChordWithSup(doc, chordStr, cx, cy, mainSize, supSize) {
  const { base, sup } = splitChordSuffix(chordStr);
  if (!sup) {
    doc.setFontSize(mainSize);
    doc.text(base, cx, cy, { align: 'center' });
  } else {
    doc.setFontSize(mainSize);
    const baseWidth = doc.getTextWidth(base);
    doc.setFontSize(supSize);
    const supWidth = doc.getTextWidth(sup);
    const totalWidth = baseWidth + supWidth;
    const startX = cx - totalWidth / 2;
    doc.setFontSize(mainSize);
    doc.text(base, startX, cy);
    doc.setFontSize(supSize);
    doc.text(sup, startX + baseWidth, cy - 2.2);
    doc.setFontSize(mainSize);
  }
}

// Draw all chords in a measure cell with superscript notation, beat-proportional widths
function drawMeasureChords(doc, chords, mx, my, cellWidth, cellHeight, converterFn, chartKey) {
  const centerY = my + cellHeight / 2 + 0.5;
  if (chords.length === 1) {
    const converted = converterFn(chords[0].chord, chartKey);
    drawChordWithSup(doc, converted, mx + cellWidth / 2, centerY, 9, 6.5);
  } else {
    const totalBeats = chords.reduce((s, c) => s + (c.beats || 4), 0);
    let slotX = mx;
    chords.forEach((chordObj, i) => {
      const slotW = ((chordObj.beats || 4) / totalBeats) * cellWidth;
      const converted = converterFn(chordObj.chord, chartKey);
      drawChordWithSup(doc, converted, slotX + slotW / 2, centerY, 7, 5);
      // Divider between chords
      if (i < chords.length - 1) {
        doc.setDrawColor(180, 180, 180);
        doc.line(slotX + slotW, my + 1.5, slotX + slotW, my + cellHeight - 1.5);
        doc.setDrawColor(0, 0, 0);
      }
      slotX += slotW;
    });
    doc.setFontSize(9);
  }
}

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

    // Chart Info with notation indicator
    doc.setFontSize(10);
    doc.text(`Key: ${chart.key}    Time: ${chart.time_signature}    [Roman Numerals]`, margin, yPosition);
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

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const numRows = Math.ceil(section.measures.length / measuresPerRow);
      const sectionHeight = 5 + (section.arrangement_cue ? 3.5 : 0) + (numRows * cellHeight);

      // Determine which column to place this section
      let isLeftColumn = leftY <= rightY;
      let x = isLeftColumn ? leftX : rightX;
      let y = isLeftColumn ? leftY : rightY;

      // Check if section fits in current column
      if (y + sectionHeight > pageHeight - margin) {
        // Try the other column
        isLeftColumn = !isLeftColumn;
        x = isLeftColumn ? leftX : rightX;
        y = isLeftColumn ? leftY : rightY;

        // If still doesn't fit, move to new page
        if (y + sectionHeight > pageHeight - margin) {
          doc.addPage();
          leftY = margin;
          rightY = margin;
          isLeftColumn = true;
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
      y += 5;

      if (section.arrangement_cue) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'italic');
        doc.text(section.arrangement_cue, x, y);
        y += 3.5;
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

        // Draw centered chords in Roman Numeral notation with superscript
        if (measure.chords && measure.chords.length > 0) {
          drawMeasureChords(doc, measure.chords, mx, my, cellWidth, cellHeight, chordToRoman, chart.key);
        }

        // Draw cue if present
        if (measure.cue) {
          doc.setFontSize(7);
          doc.text(measure.cue, mx + 1, my + cellHeight - 1.5, { maxWidth: cellWidth - 2 });
          doc.setFontSize(9);
        }
      }

      y += numRows * cellHeight + sectionSpacing;

      if (isLeftColumn) {
        leftY = y;
      } else {
        rightY = y;
      }
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${chart.title.replace(/[^a-z0-9]/gi, '_')}_roman.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating Roman PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});