import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Catch-all route: serve React SPA index.html for all non-API routes
  @Get('*')
  serveApp(@Res() res: Response) {
    // __dirname = .../apps/api/dist/src at runtime
    // 3 levels up = .../apps, then web/dist/index.html
    const indexPath = join(__dirname, '..', '..', '..', 'web', 'dist', 'index.html');

    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }

    // Fallback for local development when no web build exists
    return res.status(404).json({
      statusCode: 404,
      error: 'Not Found',
      message: 'Frontend not built. Run pnpm build:web first.',
    });
  }
}
