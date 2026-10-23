// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// Actions available to artifacts rendered inside a chat or a feature tab (e.g. clicking an example-question chip).
import { createContext, useContext } from 'react';

export type ArtifactActions = { ask?: (question: string) => void };
export const ArtifactActionsContext = createContext<ArtifactActions>({});
export const useArtifactActions = () => useContext(ArtifactActionsContext);
