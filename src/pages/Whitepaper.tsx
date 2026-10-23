// © 2026 Dea Saka Kurnia Putra. All rights reserved.
// /whitepaper (§10.10): in-app reader of kit/whitepaper/FINANDEX_WHITEPAPER_{ID,EN}.md (sticky table of contents,
// chapter markers, reading time, ID/EN toggle that keeps the chapter position, focus/presentation mode with ←/→),
// plus downloads of the PDFs (ID & EN) and the .pptx presentation with version, date, size and SHA-256 from
// public/whitepaper/manifest.json (copied & verified from the kit at build time).
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { buttonClass, Button, ErrorState, LoadingBlock } from '../components/ui';
import { creditFor } from '../config/brand';
import { useLocale } from '../lib/locale';
import { useApp } from '../lib/store';
import { formatNumber } from '../shared/format';
import { useQuery } from '@tanstack/react-query';

type WpManifest = { version: string; date: string; author: string; copyright: string; files: { file: string; bytes: number; sha256: string; lang: string; kind: string }[] };
export const WHITEPAPER_FILES = { id: 'Finandex_Whitepaper_ID.pdf', en: 'Finandex_Whitepaper_EN.pdf', pptx: 'Finandex_Platform_Overview.pptx' } as const;

const fetchText = (u: string) => fetch(u).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))));

/** Strip front matter and turn the kit's figure HTML into Markdown images (raw HTML is never rendered). */
export function prepareMarkdown(md: string): string {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<div class="figure"><img src="([^"]+)" alt="([^"]*)"\s*\/?><p class="caption">([^<]*)<\/p><\/div>/g, (_m, src: string, alt: string, cap: string) => `![${alt}](/whitepaper/${src})\n\n*${cap}*`);
}

export function chaptersOf(md: string): { id: string; title: string }[] {
  return [...md.matchAll(/^## (.+)$/gm)].map((m, i) => ({ id: `ch-${i}`, title: m[1]!.trim() }));
}

const sizeLabel = (b: number, locale: 'id' | 'en') => `${formatNumber(b / 1024, locale, 0)} KB`;

const textOf = (n: React.ReactNode): string => (typeof n === 'string' || typeof n === 'number' ? String(n) : Array.isArray(n) ? n.map(textOf).join('') : n && typeof n === 'object' && 'props' in n ? textOf((n.props as { children?: React.ReactNode }).children) : '');
/** Stable heading id: the index of the chapter with the same title (no render-time counters). */
function chapterId(chapters: { id: string; title: string }[], children: React.ReactNode): string | undefined {
  const title = textOf(children).trim();
  return chapters.find((c) => c.title.replace(/[*_`]/g, '') === title)?.id;
}

function DownloadCard({ name, label, manifest }: { name: string; label: string; manifest: WpManifest | undefined }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const f = manifest?.files.find((x) => x.file === name);
  return (
    <div className="pane-2 flex flex-col gap-2 p-4">
      <a href={`/whitepaper/${name}`} download className={buttonClass('primary', 'md')}>
        {label}
      </a>
      {f && manifest && (
        <dl className="space-y-0.5 text-xs text-ink-muted">
          <div>
            <dt className="inline">{t('wp.version')}: </dt>
            <dd className="inline">
              {manifest.version} · {manifest.date} · {sizeLabel(f.bytes, locale)}
            </dd>
          </div>
          <div className="break-all">
            <dt className="inline">SHA-256: </dt>
            <dd className="inline font-mono">{f.sha256}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default function Whitepaper() {
  const { t } = useTranslation();
  const locale = useLocale();
  const setLocale = useApp((s) => s.setLocale);
  const [lang, setLang] = useState<'id' | 'en'>(locale);
  const [chapter, setChapter] = useState(0);
  const [focus, setFocus] = useState(false);
  const mf = useQuery({ queryKey: ['wp-manifest'], queryFn: () => fetchText('/whitepaper/manifest.json').then((s) => JSON.parse(s) as WpManifest), staleTime: Infinity });
  const md = useQuery({ queryKey: ['wp', lang], queryFn: () => fetchText(`/whitepaper/FINANDEX_WHITEPAPER_${lang.toUpperCase()}.md`), staleTime: Infinity });
  const text = useMemo(() => (md.data ? prepareMarkdown(md.data) : ''), [md.data]);
  const chapters = useMemo(() => chaptersOf(text), [text]);
  const sections = useMemo(() => {
    const parts = text.split(/^(?=## )/m);
    return { intro: parts[0] ?? '', list: parts.slice(1) };
  }, [text]);
  const minutes = Math.max(1, Math.round(text.split(/\s+/).length / 200));
  const root = useRef<HTMLDivElement>(null);

  // Keep the chapter position when switching ID/EN (both editions have the same chapter order).
  const switchLang = (l: 'id' | 'en') => {
    setLang(l);
    if (l !== locale) setLocale(l);
  };
  useEffect(() => {
    if (!md.data || focus) return;
    document.getElementById(`ch-${chapter}`)?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only after a language switch
  }, [md.data]);
  useEffect(() => {
    if (!focus) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setChapter((c) => Math.min(sections.list.length - 1, c + 1));
      else if (e.key === 'ArrowLeft') setChapter((c) => Math.max(0, c - 1));
      else if (e.key === 'Escape') setFocus(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [focus, sections.list.length]);
  useEffect(() => {
    if (focus) return;
    const io = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setChapter(Number(v.target.id.replace('ch-', '')));
    }, { rootMargin: '-20% 0px -70% 0px' });
    root.current?.querySelectorAll('h2[id^="ch-"]').forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [text, focus]);

  const components = {
    h1: () => null,
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 id={chapterId(chapters, children)} className="mt-10 scroll-mt-24 font-display text-2xl">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mt-6 text-lg font-semibold">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="mt-3 leading-relaxed">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="mt-3 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="mt-3 list-decimal space-y-1 pl-5">{children}</ol>,
    blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="prov-flag mt-3 rounded-xl bg-pane-2 p-3 text-sm">{children}</blockquote>,
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="mt-3 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => <th className="border-b border-edge bg-pane-2 px-3 py-2 text-left font-medium">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-edge px-3 py-2 align-top">{children}</td>,
    img: ({ src, alt }: { src?: string; alt?: string }) => <img src={src} alt={alt ?? ''} className="mt-4 w-full rounded-xl border border-edge bg-pane p-2" loading="lazy" />,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} className="text-primary underline" target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    ),
    hr: () => <hr className="my-6 border-edge" />,
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="font-display text-3xl">{t('wp.title')}</h1>
        <p className="measure text-ink-muted">{t('wp.intro')}</p>
        <p className="text-sm">{creditFor(locale)}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <DownloadCard name={WHITEPAPER_FILES.id} label={t('wp.downloadId')} manifest={mf.data} />
          <DownloadCard name={WHITEPAPER_FILES.en} label={t('wp.downloadEn')} manifest={mf.data} />
          <DownloadCard name={WHITEPAPER_FILES.pptx} label={t('wp.downloadPptx')} manifest={mf.data} />
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label={t('wp.language')} className="flex gap-1">
          {(['id', 'en'] as const).map((l) => (
            <Button key={l} size="sm" variant={lang === l ? 'primary' : 'outline'} aria-pressed={lang === l} onClick={() => switchLang(l)}>
              {l === 'id' ? 'Bahasa Indonesia' : 'English'}
            </Button>
          ))}
        </div>
        <span className="text-sm text-ink-muted">{t('wp.readingTime', { n: minutes })}</span>
        <Button size="sm" variant="ghost" onClick={() => setFocus(true)} disabled={!sections.list.length}>
          {t('wp.focus')}
        </Button>
      </div>
      {md.isLoading && <LoadingBlock rows={6} />}
      {md.isError && <ErrorState onRetry={() => void md.refetch()} />}
      {md.data && !focus && (
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <nav aria-label={t('wp.toc')} className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto">
            <p className="mb-2 text-sm font-semibold">{t('wp.toc')}</p>
            <ol className="space-y-1 text-sm">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} aria-current={i === chapter ? 'location' : undefined} className={clsx('block rounded-xl px-2 py-1.5 hover:bg-pane-2', i === chapter ? 'text-data' : 'text-ink-muted')}>
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article ref={root} lang={lang} className="measure min-w-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components as never}>
              {text}
            </ReactMarkdown>
          </article>
        </div>
      )}
      {md.data && focus && (
        <div role="dialog" aria-modal="true" aria-label={t('wp.focus')} className="fixed inset-0 z-50 overflow-y-auto bg-field-1 p-6 md:p-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between gap-2 text-sm text-ink-muted">
              <span className="tabular">
                {chapter + 1} / {sections.list.length}
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setChapter(Math.max(0, chapter - 1))} disabled={chapter === 0} aria-label={t('wp.prev')}>
                  ←
                </Button>
                <Button size="sm" onClick={() => setChapter(Math.min(sections.list.length - 1, chapter + 1))} disabled={chapter >= sections.list.length - 1} aria-label={t('wp.next')}>
                  →
                </Button>
                <Button size="sm" variant="primary" onClick={() => setFocus(false)}>
                  {t('dex.close')}
                </Button>
              </div>
            </div>
            <article lang={lang}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components as never}>
                {sections.list[chapter] ?? ''}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
