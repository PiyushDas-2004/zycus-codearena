import { Flag, Inbox, Save, Send } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { envResult } from '@/config/env';
import {
  Alert,
  AppFooter,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  EmptyState,
  IconButton,
  Kbd,
  LoadingState,
  ProductLockup,
  Skeleton,
  SpectrumBar,
  TextArea,
  TextField,
  toast,
} from '@/design/components';
import { NotFoundPage } from '@/app/ErrorPages';

const swatchGroups: { title: string; note?: string; tokens: [string, string][] }[] = [
  {
    title: 'Core blues',
    tokens: [
      ['--zy-navy-950', 'Navy 950'],
      ['--zy-navy-900', 'Navy 900 · primary'],
      ['--zy-navy-800', 'Navy 800'],
      ['--zy-navy-700', 'Navy 700'],
      ['--zy-blue-700', 'Blue 700 · hover'],
      ['--zy-blue-650', 'Blue 650 · titles'],
      ['--zy-blue-600', 'Blue 600 · accent'],
      ['--zy-blue-500', 'Blue 500'],
      ['--zy-blue-200', 'Blue 200'],
      ['--zy-blue-100', 'Blue 100 (derived)'],
      ['--zy-blue-50', 'Blue 50'],
    ],
  },
  {
    title: 'Accents',
    note: 'Decorative only: these fail WCAG AA as text on white.',
    tokens: [
      ['--zy-gold-500', 'Gold'],
      ['--zy-green-500', 'Green'],
      ['--zy-teal-400', 'Teal'],
      ['--zy-cyan-500', 'Cyan'],
    ],
  },
  {
    title: 'Neutrals',
    tokens: [
      ['--zy-white', 'White · surface'],
      ['--zy-gray-25', 'Gray 25 · app bg'],
      ['--zy-gray-75', 'Gray 75 · sunken'],
      ['--zy-gray-200', 'Gray 200 · border'],
      ['--zy-gray-300', 'Gray 300 (derived)'],
      ['--zy-slate-600', 'Slate 600 · muted text'],
      ['--zy-gray-800', 'Gray 800 · text'],
    ],
  },
  {
    title: 'Semantic (derived)',
    tokens: [
      ['--zy-success-700', 'Success'],
      ['--zy-success-50', 'Success surface'],
      ['--zy-warning-700', 'Warning'],
      ['--zy-warning-50', 'Warning surface'],
      ['--zy-danger-700', 'Danger'],
      ['--zy-danger-50', 'Danger surface'],
    ],
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  const value =
    typeof window === 'undefined'
      ? ''
      : getComputedStyle(document.documentElement).getPropertyValue(token).trim().toUpperCase();
  return (
    <div className="min-w-0">
      <div className="h-14 rounded-md border border-border" style={{ background: `var(${token})` }} />
      <p className="mt-2 text-sm font-medium text-strong">{label}</p>
      <p className="font-mono text-xs text-muted">{value}</p>
      <p className="truncate font-mono text-xs text-muted">{token}</p>
    </div>
  );
}

export default function StyleGuideRoute() {
  const [dialog, setDialog] = useState<null | 'default' | 'blocking'>(null);
  // Always visible in local dev; elsewhere only when VITE_ENABLE_STYLEGUIDE=true.
  const allowed = import.meta.env.DEV || (envResult.ok && envResult.env.enableStyleguide);
  if (!allowed) return <NotFoundPage />;

  return (
    <div className="min-h-dvh">
      <SpectrumBar />
      <header className="border-b border-border bg-surface px-8 py-4">
        <ProductLockup />
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-8 py-10">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted">Design system</p>
          <h1 className="mt-1 text-4xl font-light text-title">CodeArena style guide</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Every color comes from <code className="font-mono text-sm">src/design/tokens.css</code>. Sources
            for each value are listed in BRAND_SOURCES.md.
          </p>
        </div>

        <Section title="Color tokens">
          {swatchGroups.map((g) => (
            <div key={g.title} className="flex flex-col gap-3">
              <div>
                <h3 className="text-[15px] font-semibold">{g.title}</h3>
                {g.note && <p className="text-sm text-muted">{g.note}</p>}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                {g.tokens.map(([t, l]) => (
                  <Swatch key={t} token={t} label={l} />
                ))}
              </div>
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="bg-gradient-hero h-14 rounded-md" />
              <p className="mt-2 text-sm font-medium text-strong">Hero gradient</p>
            </div>
            <div>
              <div className="bg-gradient-spectrum h-14 rounded-md" />
              <p className="mt-2 text-sm font-medium text-strong">Spectrum gradient (thin accent bar only)</p>
            </div>
          </div>
        </Section>

        <Section title="Typography · Inter">
          <Card className="flex flex-col gap-3">
            <p className="text-4xl font-light text-title">Page title · 36/300 · Blue 650</p>
            <p className="text-2xl font-semibold text-strong">Section heading · 24/600</p>
            <p className="text-lg font-semibold text-strong">Card heading · 18/600</p>
            <p>Body · 15/400 · The quick brown fox fixes the flaky FlatList render.</p>
            <p className="text-sm text-muted">Secondary · 14/400 · Slate 600</p>
            <p className="font-mono text-sm">Monospace · const answer = useMemo(() =&gt; 42, []);</p>
          </Card>
        </Section>

        <Section title="Buttons">
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Saving</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" leadingIcon={<Save className="size-4" />}>
                Small
              </Button>
              <Button size="md" trailingIcon={<Send className="size-4" />}>
                Medium
              </Button>
              <Button size="lg">Large</Button>
              <IconButton label="Mark for review" icon={<Flag className="size-5" />} />
            </div>
          </Card>
        </Section>

        <Section title="Form controls">
          <Card className="grid gap-6 md:grid-cols-2">
            <TextField label="Email address" placeholder="name@example.com" hint="Use your work email." />
            <TextField label="Access code" defaultValue="7KQ2" error="Access codes have 12 characters." />
            <TextArea
              label="Explain your fix"
              placeholder="Root cause, what you changed and why"
              containerClassName="md:col-span-2"
            />
            <Checkbox
              label="I agree to the proctoring and data-processing notice"
              description="Zycus processes webcam snapshots for this assessment only."
            />
            <Checkbox label="I will not share the questions" defaultChecked />
          </Card>
        </Section>

        <Section title="Badges and alerts">
          <div className="flex flex-wrap gap-2">
            <Badge>Not started</Badge>
            <Badge tone="info" dot>
              In progress
            </Badge>
            <Badge tone="warning" icon={<Flag className="size-3" />}>
              Marked for review
            </Badge>
            <Badge tone="success">Submitted</Badge>
            <Badge tone="danger">3 violations</Badge>
            <Badge tone="live" dot>
              Camera live
            </Badge>
          </div>
          <div className="grid gap-3">
            <Alert title="All changes saved">Your work syncs to Zycus every 10 seconds.</Alert>
            <Alert tone="success" title="System check passed" />
            <Alert tone="warning" title="10 minutes remaining">
              Make sure your explanation notes are complete.
            </Alert>
            <Alert tone="danger" title="You're offline">
              Your work is saved on this device and will sync when the connection returns.
            </Alert>
          </div>
        </Section>

        <Section title="Overlays and notifications">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setDialog('default')}>
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setDialog('blocking')}>
              Open blocking overlay
            </Button>
            <Button variant="ghost" onClick={() => toast.success('All changes saved')}>
              Success toast
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast.warning('Tab switch detected', 'This has been logged.')}
            >
              Warning toast
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast.danger('Paste is disabled', 'The attempt was logged.')}
            >
              Danger toast
            </Button>
          </div>
        </Section>

        <Section title="States">
          <div className="grid gap-4 md:grid-cols-3">
            <Card padding="none">
              <EmptyState
                icon={<Inbox className="size-6" aria-hidden="true" />}
                title="No candidates yet"
                description="Add a candidate to generate an access code."
                action={<Button size="sm">Add candidate</Button>}
              />
            </Card>
            <Card padding="none">
              <LoadingState label="Checking backend health…" />
            </Card>
            <Card className="flex flex-col gap-3">
              <CardHeader title="Skeleton" as="h3" className="mb-1" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
          <p className="text-sm text-muted">
            Keyboard: <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> saves now.
          </p>
        </Section>
      </main>
      <AppFooter />

      <Dialog
        open={dialog === 'default'}
        onClose={() => setDialog(null)}
        title="Submit your assessment?"
        description="You have attempted 3 of 4 questions. You can't change your answers after submitting."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Keep working
            </Button>
            <Button onClick={() => setDialog(null)}>Submit assessment</Button>
          </>
        }
      />
      <Dialog
        open={dialog === 'blocking'}
        onClose={() => setDialog(null)}
        dismissible={false}
        tone="danger"
        title="Return to full screen"
        description="You left full-screen mode. This has been recorded. The timer is still running."
        footer={<Button onClick={() => setDialog(null)}>Re-enter full screen</Button>}
      />
    </div>
  );
}
