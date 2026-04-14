import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesDir: string;
  private readonly cache = new Map<string, HandlebarsTemplateDelegate>();

  constructor(private readonly config: ConfigService) {
    this.templatesDir = path.resolve(
      __dirname,
      '..',
      '..',
      config.getOrThrow<string>('templates.dir'),
    );
    this.logger.log(`Templates directory: ${this.templatesDir}`);
  }

  render(templateName: string, culture: string, data: Record<string, unknown>): string {
    const cacheKey = `${culture}/${templateName}`;

    if (!this.cache.has(cacheKey)) {
      const filePath = path.join(this.templatesDir, culture, `${templateName}.html`);

      // Fallback to 'en' if culture template doesn't exist
      let finalPath = filePath;
      if (!fs.existsSync(filePath)) {
        const fallback = path.join(this.templatesDir, 'en', `${templateName}.html`);
        if (fs.existsSync(fallback)) {
          finalPath = fallback;
          this.logger.warn(`Template ${cacheKey} not found, falling back to en/${templateName}.html`);
        } else {
          this.logger.error(`Template not found: ${filePath} (and no en fallback)`);
          return `<p>Email template "${templateName}" not found.</p>`;
        }
      }

      const source = fs.readFileSync(finalPath, 'utf-8');
      this.cache.set(cacheKey, Handlebars.compile(source));
    }

    const compiled = this.cache.get(cacheKey)!;
    return compiled(data);
  }

  /**
   * Get the subject line for a template. Uses a convention:
   * The template may have a <!-- subject: Your Subject --> comment.
   */
  extractSubject(html: string, fallback: string): string {
    const match = html.match(/<!--\s*subject:\s*(.+?)\s*-->/i);
    return match ? match[1].trim() : fallback;
  }
}
