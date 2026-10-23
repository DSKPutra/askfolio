// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// First-use chat consent (§13.3), stored locally with the policy version (re-asked when it changes).
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { POLICY_VERSION, useApp } from '../lib/store';
import { Button } from './ui';

export function useConsented(): boolean {
  return useApp((s) => s.consentVersion === POLICY_VERSION);
}

export function ConsentDialog({ open, onDone }: { open: boolean; onDone: (accepted: boolean) => void }) {
  const { t } = useTranslation();
  const accept = useApp((s) => s.acceptConsent);
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onDone(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-pane border border-border bg-surface p-5">
          <Dialog.Title className="text-lg font-semibold">{t('chat.consentTitle')}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted">{t('chat.consentBody')}</Dialog.Description>
          <p className="mt-2 text-xs text-muted">{t('disclaimer.general')}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Link to="/legal/privacy" className="text-sm text-brand-text underline" onClick={() => onDone(false)}>
              {t('chat.privacyLink')}
            </Link>
            <Button
              variant="primary"
              onClick={() => {
                accept();
                onDone(true);
              }}
            >
              {t('chat.consentAccept')}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
