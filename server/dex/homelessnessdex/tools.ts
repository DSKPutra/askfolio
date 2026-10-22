// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// homelessnessdex tools (§8.5).
import { newsTools } from '../news-tools';
import type { ToolDef } from '../../tools/kit';

export const tools = (): ToolDef[] => newsTools('homelessnessdex', 'homelessness', 'Homelessness_News_Dataset_2019-2026.zip');
