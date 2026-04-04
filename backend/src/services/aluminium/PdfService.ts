import puppeteer, { Browser, Page } from 'puppeteer';
import { Quote } from '../../models/aluminium/Quote';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

export interface QuotePdfData {
  quoteNumber: string;
  customer: {
    companyName: string;
    billingCity: string;
    billingCountry: string;
  };
  commercial: {
    name: string;
  };
  status: string;
  validUntil: string;
  createdAt: string;
  lines: Array<{
    profile: {
      reference: string;
      name: string;
    };
    quantity: number;
    unitLength: number;
    unitWeight: number;
    totalWeight: number;
    unitSurface?: number;
    totalSurface?: number;
    unitPrice: number;
    lineDiscount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  customerNotes?: string;
}

export class PdfService {
  private browser: Browser | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Get or compile the quote template
   */
  private async getQuoteTemplate(): Promise<HandlebarsTemplateDelegate> {
    const templatePath = path.join(__dirname, '../templates/emails/quote-pdf.hbs');
    
    if (this.templateCache.has('quote')) {
      return this.templateCache.get('quote')!;
    }

    // First check if custom template exists, otherwise use default
    let templateSource: string;
    if (fs.existsSync(templatePath)) {
      templateSource = fs.readFileSync(templatePath, 'utf-8');
    } else {
      // Default template
      templateSource = this.getDefaultQuoteTemplate();
    }

    const template = Handlebars.compile(templateSource);
    this.templateCache.set('quote', template);
    return template;
  }

  /**
   * Get default quote PDF template
   */
  private getDefaultQuoteTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #0d9488; padding-bottom: 20px; }
    .company-info { font-size: 14px; }
    .company-name { font-size: 24px; font-weight: bold; color: #0d9488; }
    .quote-info { text-align: right; }
    .quote-number { font-size: 18px; font-weight: bold; }
    .quote-date { color: #666; }
    
    .status-badge { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 12px; 
      font-size: 11px; 
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-BROUILLON { background: #fef3c7; color: #92400e; }
    .status-ENVOYÉ { background: #dbeafe; color: #1e40af; }
    .status-ACCEPTÉ { background: #d1fae5; color: #065f46; }
    .status-REFUSÉ { background: #fee2e2; color: #991b1b; }
    
    .section { margin-bottom: 25px; }
    .section-title { 
      font-size: 14px; 
      font-weight: bold; 
      color: #0d9488; 
      margin-bottom: 10px; 
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    
    .customer-info { display: flex; justify-content: space-between; }
    .customer-box { width: 48%; }
    .info-row { display: flex; margin-bottom: 5px; }
    .info-label { font-weight: bold; width: 100px; color: #666; }
    .info-value { flex: 1; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { 
      background: #f3f4f6; 
      padding: 10px; 
      text-align: left; 
      font-weight: bold; 
      font-size: 11px;
      text-transform: uppercase;
      color: #666;
      border-bottom: 2px solid #e5e7eb;
    }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .totals { margin-left: auto; width: 300px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .total-row.final { font-size: 16px; font-weight: bold; color: #0d9488; border-bottom: 2px solid #0d9488; }
    
    .notes { background: #f9fafb; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .notes-title { font-weight: bold; margin-bottom: 5px; }
    
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      color: #666; 
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">ERP Aluminium</div>
        <div>123 Rue de l'Aluminium</div>
        <div>75001 Paris, France</div>
        <div>Tél: +33 1 23 45 67 89</div>
      </div>
      <div class="quote-info">
        <div class="quote-number">Devis {{quoteNumber}}</div>
        <div class="quote-date">Date: {{formatDate createdAt}}</div>
        <div>Validité: {{formatDate validUntil}}</div>
        <div style="margin-top: 10px;">
          <span class="status-badge status-{{status}}">{{status}}</span>
        </div>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="section">
      <div class="section-title">Informations Client</div>
      <div class="customer-info">
        <div class="customer-box">
          <div class="info-row"><span class="info-label">Client:</span><span class="info-value">{{customer.companyName}}</span></div>
          <div class="info-row"><span class="info-label">Ville:</span><span class="info-value">{{customer.billingCity}}</span></div>
          <div class="info-row"><span class="info-label">Pays:</span><span class="info-value">{{customer.billingCountry}}</span></div>
        </div>
        <div class="customer-box">
          <div class="info-row"><span class="info-label">Commercial:</span><span class="info-value">{{commercial.name}}</span></div>
        </div>
      </div>
    </div>

    <!-- Quote Lines -->
    <div class="section">
      <div class="section-title">Détails du Devis</div>
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>Désignation</th>
            <th class="text-center">Qté</th>
            <th class="text-right">Longueur (m)</th>
            <th class="text-right">Poids unit. (kg)</th>
            <th class="text-right">Poids total (kg)</th>
            <th class="text-right">Prix unit. (€)</th>
            <th class="text-right">Remise (€)</th>
            <th class="text-right">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          {{#each lines}}
          <tr>
            <td>{{profile.reference}}</td>
            <td>{{profile.name}}</td>
            <td class="text-center">{{quantity}}</td>
            <td class="text-right">{{unitLength}}</td>
            <td class="text-right">{{unitWeight}}</td>
            <td class="text-right">{{totalWeight}}</td>
            <td class="text-right">{{formatNumber unitPrice 2}}</td>
            <td class="text-right">{{formatNumber lineDiscount 2}}</td>
            <td class="text-right">{{formatNumber lineTotal 2}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="section">
      <div class="totals">
        <div class="total-row">
          <span>Sous-total:</span>
          <span>{{formatNumber subtotal 2}} €</span>
        </div>
        {{#if discountPercent}}
        <div class="total-row">
          <span>Remise ({{discountPercent}}%):</span>
          <span>-{{formatNumber discountAmount 2}} €</span>
        </div>
        {{/if}}
        <div class="total-row">
          <span>TVA ({{vatRate}}%):</span>
          <span>{{formatNumber vatAmount 2}} €</span>
        </div>
        <div class="total-row final">
          <span>Total TTC:</span>
          <span>{{formatNumber total 2}} €</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    {{#if notes}}
    <div class="notes">
      <div class="notes-title">Notes:</div>
      <div>{{notes}}</div>
    </div>
    {{/if}}

    {{#if customerNotes}}
    <div class="notes">
      <div class="notes-title">Notes client:</div>
      <div>{{customerNotes}}</div>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p>ERP Aluminium - Logiciel de gestion des profilés aluminium</p>
      <p>Ce devis est généré automatiquement et n'a pas besoin de signature</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format date for display
   */
  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Format number with specified decimals
   */
  private formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Prepare quote data for PDF template
   */
  private prepareQuoteData(quote: Quote): QuotePdfData {
    return {
      quoteNumber: quote.quoteNumber,
      customer: {
        companyName: quote.customer?.companyName || 'N/A',
        billingCity: quote.customer?.billingCity || 'N/A',
        billingCountry: quote.customer?.billingCountry || 'N/A',
      },
      commercial: {
        name: 'Commercial', // Would need to join with user table
      },
      status: quote.status,
      validUntil: quote.validUntil.toString(),
      createdAt: quote.createdAt.toString(),
      lines: (quote.lines || []).map((line: any) => ({
        profile: {
          reference: line.profile?.reference || 'N/A',
          name: line.profile?.name || line.description || 'N/A',
        },
        quantity: line.quantity,
        unitLength: Number(line.unitLength),
        unitWeight: Number(line.unitWeight),
        totalWeight: Number(line.totalWeight),
        unitSurface: line.unitSurface ? Number(line.unitSurface) : undefined,
        totalSurface: line.totalSurface ? Number(line.totalSurface) : undefined,
        unitPrice: Number(line.unitPrice),
        lineDiscount: Number(line.lineDiscount || 0),
        lineTotal: Number(line.lineTotal),
      })),
      subtotal: Number(quote.subtotal),
      discountPercent: Number(quote.discountPercent || 0),
      discountAmount: Number(quote.discountAmount || 0),
      vatRate: Number(quote.vatRate || 20),
      vatAmount: Number(quote.vatAmount),
      total: Number(quote.total),
      notes: quote.notes,
      customerNotes: quote.customerNotes,
    };
  }

  /**
   * Generate PDF for a quote
   */
  async generateQuotePdf(quote: Quote): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      // Prepare data
      const data = this.prepareQuoteData(quote);
      
      // Get template
      const template = await this.getQuoteTemplate();
      
      // Add helper functions
      const hbs = Handlebars;
      hbs.registerHelper('formatDate', (date: string | Date) => this.formatDate(date));
      hbs.registerHelper('formatNumber', (value: number, decimals: number) => this.formatNumber(value, decimals));
      
      // Render template
      const html = template(data);
      
      // Set page content
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /**
   * Save PDF to file
   */
  async saveQuotePdf(quote: Quote, outputPath: string): Promise<string> {
    const pdf = await this.generateQuotePdf(quote);
    fs.writeFileSync(outputPath, pdf);
    return outputPath;
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PdfService;
