// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// populationdex tools (§8.5).
import { newsTools } from '../news-tools';
import type { ToolDef } from '../../tools/kit';

export const tools = (): ToolDef[] => newsTools('populationdex', 'population', 'Population_News_Dataset_2019-2026.zip');
