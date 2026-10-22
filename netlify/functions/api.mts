// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Netlify Functions adapter.
import { handle } from '../../server/handler';

export const config = { path: '/api/*' };

export default async (request: Request): Promise<Response> => handle(request, process.env);
