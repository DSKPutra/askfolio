// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Vercel Functions adapter (Node runtime, Web Request/Response).
import { handle } from '../server/handler';

export const config = { maxDuration: 60 };

export default {
  fetch(request: Request): Promise<Response> {
    return handle(request, process.env);
  },
};
