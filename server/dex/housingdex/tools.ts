// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// housingdex tools (§8.5).
import { newsTools } from '../news-tools';
import type { ToolDef } from '../../tools/kit';

export const tools = (): ToolDef[] => newsTools('housingdex', 'housingnews', 'Housing_News_Dataset_2019-2026.zip');
