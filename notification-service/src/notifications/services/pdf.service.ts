import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface TicketPdfData {
  ticketId: string;
  userId: string;
  userEmail: string;
  ticketType: string;
  purchaseDate: string;
  qrCodeImage: string; // Base64 encoded PNG
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generate a PDF ticket with QR code
   * @param ticketData Ticket information
   * @returns Promise<Buffer> PDF as buffer
   */
  async generateTicketPdf(ticketData: TicketPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];

        // Collect PDF data chunks
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          this.logger.log(`PDF generated successfully for ticket ${ticketData.ticketId}`);
          resolve(pdfBuffer);
        });
        doc.on('error', (error) => {
          this.logger.error(`Error generating PDF: ${error.message}`);
          reject(error);
        });

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('TICKET DE TRANSPORT', { align: 'center' })
          .moveDown(0.5);

        // Horizontal line
        doc
          .strokeColor('#333333')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown(1);

        // Ticket information
        doc.fontSize(12).font('Helvetica');

        const ticketTypeLabels = {
          SIMPLE: 'Ticket Simple',
          JOURNEE: 'Ticket Journée',
          HEBDO: 'Ticket Hebdomadaire',
          MENSUEL: 'Ticket Mensuel',
        };

        const ticketTypeLabel = ticketTypeLabels[ticketData.ticketType] || ticketData.ticketType;

        // Left column
        doc
          .font('Helvetica-Bold')
          .text('Type de ticket:', 50, doc.y)
          .font('Helvetica')
          .text(ticketTypeLabel, 200, doc.y - 12);

        doc.moveDown(0.8);

        doc
          .font('Helvetica-Bold')
          .text('Numéro de ticket:', 50, doc.y)
          .font('Helvetica')
          .text(`#${ticketData.ticketId}`, 200, doc.y - 12);

        doc.moveDown(0.8);

        doc
          .font('Helvetica-Bold')
          .text('Date d\'achat:', 50, doc.y)
          .font('Helvetica')
          .text(this.formatDate(ticketData.purchaseDate), 200, doc.y - 12);

        doc.moveDown(0.8);

        doc
          .font('Helvetica-Bold')
          .text('Email:', 50, doc.y)
          .font('Helvetica')
          .text(ticketData.userEmail, 200, doc.y - 12);

        doc.moveDown(2);

        // QR Code section
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('SCANNEZ CE QR CODE POUR VALIDER', { align: 'center' })
          .moveDown(1);

        // Add QR code image (centered)
        if (ticketData.qrCodeImage) {
          try {
            // Decode Base64 to buffer
            const qrImageBuffer = Buffer.from(ticketData.qrCodeImage, 'base64');

            // Center the QR code
            const qrSize = 200;
            const pageWidth = 595; // A4 width in points
            const xPosition = (pageWidth - qrSize) / 2;

            doc.image(qrImageBuffer, xPosition, doc.y, {
              width: qrSize,
              height: qrSize,
            });

            doc.moveDown(12);
          } catch (error) {
            this.logger.error(`Error adding QR code to PDF: ${error.message}`);
            doc.text('QR Code non disponible', { align: 'center' });
            doc.moveDown(2);
          }
        }

        // Footer
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#666666')
          .text('Conservez ce ticket jusqu\'à la fin de votre trajet', { align: 'center' })
          .moveDown(0.5)
          .text('Service de Transport Urbain', { align: 'center' });

        // Finalize the PDF
        doc.end();
      } catch (error) {
        this.logger.error(`Failed to create PDF document: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Format ISO date string to readable format
   */
  private formatDate(isoDate: string): string {
    try {
      const date = new Date(isoDate);
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  }
}
