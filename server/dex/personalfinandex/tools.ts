// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// PersonalFinanDex tools (§8.5).
import { socialTools } from '../social-tools';
import type { ToolDef } from '../../tools/kit';

export const tools = (): ToolDef[] => socialTools('personalfinandex', 'personalfinance', 'Personal_Finance_and_Financial_Independence.zip');
