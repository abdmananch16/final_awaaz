const PDFDocument = require('pdfkit');

function exportComplaintsPDF(rows) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#00D4AA')
        .text('AWAAZ360 - Complaint Report', { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#888888')
        .text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} | Total: ${rows.length}`, { align: 'center' });
      doc.moveDown(0.5);

      // Table header
      const headers = ['ID', 'Name', 'Category', 'Location', 'Date', 'Status'];
      const colWidths = [90, 80, 80, 80, 70, 70];
      const startX = 50;
      let y = doc.y;

      // Draw header
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 20).fill('#0f1e2e');
      let x = startX;
      headers.forEach((h, i) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#00D4AA').text(h, x + 3, y + 5, { width: colWidths[i], align: 'center' });
        x += colWidths[i];
      });

      y += 20;
      const rowColors = ['#1B2D45', '#162333'];

      // Draw rows
      rows.forEach((row, ri) => {
        const [id, name, category, location, date, status] = row;
        const rowData = [id, name, category, location, date, status];

        // Check if we need a new page
        if (y > 720) {
          doc.addPage();
          y = 50;
          doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 20).fill('#0f1e2e');
          let x2 = startX;
          headers.forEach((h, i) => {
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#00D4AA').text(h, x2 + 3, y + 5, { width: colWidths[i], align: 'center' });
            x2 += colWidths[i];
          });
          y += 20;
        }

        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).fill(rowColors[ri % 2]);
        let x2 = startX;
        rowData.forEach((cell, i) => {
          doc.fontSize(8).font('Helvetica').fillColor('#E8F0FE').text(String(cell), x2 + 3, y + 4, { width: colWidths[i], align: 'center' });
          x2 += colWidths[i];
        });

        // Grid lines
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 18).strokeColor('#2a4060').lineWidth(0.3).stroke();

        y += 18;
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { exportComplaintsPDF };
