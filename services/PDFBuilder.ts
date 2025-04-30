import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import path from 'path';
import { ClauseField } from '../types';

/**
 * PDFBuilder service for generating contract PDFs from
 * selected clauses
 */
export class PDFBuilder {
  private static md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });

  /**
   * Creates a PDF document from the original contract with the selected clauses
   * @param contractText Original contract text
   * @param selectedClauses Map of selected clause fields to their text content
   * @returns URL path to the generated PDF
   */
  static async generatePDF(
    contractText: string,
    selectedClauses: Record<ClauseField, string>
  ): Promise<string> {
    const timestamp = Date.now();
    const filename = `contract_${timestamp}`;
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const markdownContent = this.generateMarkdown(contractText, selectedClauses);
    const htmlContent = this.md.render(markdownContent);
    const htmlPath = path.join(tempDir, `${filename}.html`);
    fs.writeFileSync(htmlPath, this.wrapHtml(htmlContent));

    const pdfPath = path.join(tempDir, `${filename}.pdf`);
    await this.htmlToPdf(htmlPath, pdfPath);

    return `/api/download?file=${filename}.pdf`;
  }

  /**
   * Generates markdown content by replacing original clauses with selected alternatives
   */
  private static generateMarkdown(
    contractText: string,
    selectedClauses: Record<ClauseField, string>
  ): string {
    const sections = this.parseContractSections(contractText);
    let markdown = `# CONTRACT

`;

    // Render sections
    for (const [title, content] of Object.entries(sections)) {
      markdown += `## ${title}\n\n`;
      if (title.includes('PAYMENT') && selectedClauses.payment) {
        markdown += this.formatClauseText(selectedClauses.payment) + '\n\n';
      } else if (title.includes('DELIVERY') && selectedClauses.delivery) {
        markdown += this.formatClauseText(selectedClauses.delivery) + '\n\n';
      } else if (title.includes('PENALTIES') && selectedClauses.penalty) {
        markdown += this.formatClauseText(selectedClauses.penalty) + '\n\n';
      } else {
        markdown += this.formatClauseText(content) + '\n\n';
      }
    }

    // Signatures
    markdown += `## SIGNATURES\n\n`;
    markdown += `Client: _______________________   Date: ____________\n\n`;
    markdown += `Provider: _____________________   Date: ____________\n\n`;
    return markdown;
  }

  /** Format clause text into paragraphs */
  private static formatClauseText(text: string): string {
    const clean = this.sanitizeText(text);
    return clean
      .split(/\.\s+/)
      .filter(s => s.trim())
      .map(s => s.trim() + '.')
      .join('\n\n');
  }

  /** Split contract text into titled sections */
  private static parseContractSections(text: string): Record<string,string> {
    const clean = this.sanitizeText(text);
    const lines = clean.split('\n').map(l => l.trim());
    const sections: Record<string,string> = {};
    let current = 'Preamble';
    let buf: string[] = [];
    for (const line of lines) {
      const isTitle = line.toUpperCase() === line && line.endsWith(':');
      if (isTitle) {
        if (buf.length) sections[current] = buf.join('\n\n');
        current = line.replace(/:$/,'');
        buf = [];
      } else if (line) {
        buf.push(line);
      }
    }
    if (buf.length) sections[current] = buf.join('\n\n');
    return sections;
  }

  /** Clean text for markdown/HTML */
  private static sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/[<>]/g, '_')
      .replace(/[ \t]+/g, ' ')
      .replace(/\r\n/g,'\n').replace(/\r/g,'\n')
      .trim();
  }

  /** Wrap HTML with styling, ToC, pagination, footer */
  private static wrapHtml(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Contract</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 2cm; }
  @page { @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 10pt; color: #666; } }
  body { font-family: 'Roboto', sans-serif; color: #333; margin: 0; padding: 0; }
  .container { margin: 2cm; }
  h1 { text-align: center; font-size: 24pt; margin-bottom: 1em; border-bottom: 2px solid #ccc; padding-bottom: 0.2em; }
  h2 { font-size: 16pt; font-weight: 600; color: #2a3f54; margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
  p { font-size: 12pt; line-height: 1.5; margin: 0.5em 0; text-align: justify; }
  section { margin-bottom: 1.5em; page-break-inside: avoid; }
  .clause { background: #f9f9f9; border-left: 4px solid #007acc; padding: 10px; margin: 1em 0; }
  .footer { text-align: center; margin-top: 2em; font-size: 10pt; color: #666; border-top: 1px solid #eee; padding-top: 0.5em; }
  nav.toc { page-break-after: always; margin-bottom: 2em; }
  nav.toc h2 { margin-bottom: 0.5em; }
  nav.toc ul { list-style: none; padding-left: 0; }
  nav.toc a { text-decoration: none; color: #1a0dab; }
</style>
</head>
<body>
  <div class="container">
    <h1>Contract Agreement</h1>
    <!-- Table of Contents placeholder; consider generating dynamically -->
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ul>
        <!-- TOC entries -->
      </ul>
    </nav>
    ${content}
    <div class="footer">
      Generated by Accordo – ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;
  }

  /** Use Puppeteer to render HTML to PDF */
  private static async htmlToPdf(htmlPath: string, pdfPath: string): Promise<void> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      preferCSSPageSize: true,
      scale: 1.0
    });
    await browser.close();
  }
}
