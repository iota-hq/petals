import { useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  AtSign,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  FileDown,
  Frame,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  Paperclip,
  RotateCcw,
  Square,
  Terminal,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Btn, Kbd, Dot } from '../bits'

/* ----------------------------------------------------------------------------
 * The assistant is not shipped. Everything below is spec: the intended shape of
 * a canvas assistant that edits through the same commands the UI uses.
 * ------------------------------------------------------------------------- */

function PetalMark({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <ellipse cx="8" cy="4.1" rx="2.1" ry="3.1" />
      <ellipse cx="8" cy="11.9" rx="2.1" ry="3.1" />
      <ellipse cx="4.1" cy="8" rx="3.1" ry="2.1" />
      <ellipse cx="11.9" cy="8" rx="3.1" ry="2.1" />
    </svg>
  )
}

type SendState = 'ready' | 'empty' | 'waiting' | 'streaming' | 'reasoning'

function SendButton({ state, onClick }: { state: SendState; onClick?: () => void }) {
  const label =
    state === 'streaming'
      ? 'Stop response'
      : state === 'waiting'
        ? 'Sending, waiting for the first token'
        : state === 'reasoning'
          ? 'Send message, disabled while reasoning'
          : 'Send message'
  const disabled = state === 'empty' || state === 'reasoning'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-default',
        (state === 'ready' || state === 'streaming') && 'bg-[#f472b6] text-[#2b0a1c] hover:bg-[#f472b6]/90',
        state === 'waiting' && 'bg-[#f472b6]/70 text-[#2b0a1c]',
        (state === 'empty' || state === 'reasoning') && 'bg-[#2b2b2b] text-[#9a9aa4]',
      )}
    >
      {state === 'ready' && <ArrowUp size={14} strokeWidth={2.2} />}
      {state === 'empty' && <ArrowUp size={14} />}
      {state === 'waiting' && <Loader2 size={13} className="animate-spin" />}
      {state === 'streaming' && <Square size={10} fill="currentColor" />}
      {state === 'reasoning' && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
    </button>
  )
}

function MiniIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-[#9a9aa4] transition-colors hover:bg-white/[0.06] hover:text-foreground"
    >
      {children}
    </button>
  )
}

function Composer({
  value,
  onChange,
  state = 'rest',
  compact = false,
  rows = 2,
}: {
  value: string
  onChange?: (v: string) => void
  state?: 'rest' | 'focus' | 'sending'
  compact?: boolean
  rows?: number
}) {
  const filled = value.trim().length > 0
  const field =
    'w-full resize-none bg-transparent text-[13px] leading-relaxed text-[#ececf1] placeholder:text-[#9a9aa4]/60 outline-none'
  return (
    <div
      className={cn(
        'w-full rounded-xl border bg-[#141418] transition-colors',
        state === 'focus' ? 'border-[#52525b] ring-2 ring-[#52525b]/40' : 'border-[#27272f]',
        compact ? 'px-2 py-2' : 'px-2.5 pb-2 pt-2.5',
      )}
    >
      {compact ? (
        <div className="flex h-7 items-center gap-1.5">
          <AtSign size={14} className="ml-0.5 shrink-0 text-[#9a9aa4]" />
          <Paperclip size={14} className="shrink-0 text-[#9a9aa4]" />
          <span className="min-w-0 flex-1 truncate px-1 text-[13px] text-[#ececf1]">
            {value || <span className="text-[#9a9aa4]/60">Describe a change…</span>}
          </span>
          <span className="font-mono text-[9.5px] text-white/30">/</span>
          <SendButton state={filled ? 'ready' : 'empty'} />
        </div>
      ) : (
        <>
          {onChange ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              placeholder="Describe a change…"
              aria-label="Ask petals to change the canvas"
              className={cn(field, 'min-h-[44px] max-h-[120px]')}
            />
          ) : (
            <textarea
              defaultValue={value}
              readOnly
              rows={rows}
              placeholder="Describe a change…"
              aria-label="Ask petals to change the canvas"
              className={cn(field, 'min-h-[44px] max-h-[120px]')}
            />
          )}
          <div className="mt-1 flex items-center gap-0.5">
            <MiniIcon label="Mention a layer">
              <AtSign size={14} />
            </MiniIcon>
            <MiniIcon label="Attach an image">
              <Paperclip size={14} />
            </MiniIcon>
            <span className="ml-1.5 font-mono text-[9.5px] text-white/30">/ commands</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[9.5px] text-white/30">
                {state === 'sending' ? 'esc to stop' : '⌘↵'}
              </span>
              <SendButton state={state === 'sending' ? 'streaming' : filled ? 'ready' : 'empty'} />
            </span>
          </div>
        </>
      )}
    </div>
  )
}

/** The honeycomb fill a changed card wears. Document content, so it may carry colour. */
function Honeycomb({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 180 112" aria-hidden="true" className={className} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="28" height="16" patternUnits="userSpaceOnUse">
          <path d="M7 1l7 4v8l-7 4-7-4V5z" fill="none" stroke="#d9bfa8" strokeWidth="1" />
          <path d="M21 9l7 4v8l-7 4-7-4v-8z" fill="none" stroke="#d9bfa8" strokeWidth="1" opacity=".55" />
        </pattern>
      </defs>
      <rect width="180" height="112" fill="#f3e9df" />
      <rect width="180" height="112" fill={`url(#${id})`} />
    </svg>
  )
}

/* ------------------------------- Prompt input ------------------------------ */

function PromptInputPage() {
  const [draft, setDraft] = useState('')
  return (
    <Page
      title="Prompt input"
      lead="The composer docked over the canvas. It writes commands, not chat."
      spec
      meta="44–120px · 28px send · 4 states"
    >
      <Section title="Composer" note="44 / 96 / 120px">
        <div className="flex flex-col gap-3">
          <Tiles
            min={280}
            items={[
              { label: 'compact', note: '44px', node: <Composer value="" compact /> },
              {
                label: 'expanded',
                note: '96px',
                node: (
                  <Composer value="Make the card 320 wide and set its fill to the honeycomb pattern" state="focus" />
                ),
              },
              {
                label: 'max',
                note: '120px, then scrolls',
                node: (
                  <Composer
                    rows={5}
                    value="Create a 390 × 844 frame for checkout, reuse the card pattern, and keep the header outside the frame."
                    state="focus"
                  />
                ),
              },
            ]}
          />
          <Stage
            pad={false}
            caption="Docked 16px above the canvas edge, 560px wide. The field grows upward and never pushes the frame."
          >
            <div className="relative h-[248px] w-full overflow-hidden bg-[#0b0b0d]">
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(#1f1f26 0.7px, transparent 0.7px)',
                  backgroundSize: '18px 18px',
                }}
              />
              <div className="absolute left-5 top-4 font-mono text-[9.5px] text-white/35">
                Sleepy-Walrus-3902 · Page 1
              </div>
              <div className="absolute left-5 top-9 w-[190px] overflow-hidden rounded-md border border-white/12 bg-[#f3e9df] p-3">
                <p className="text-[10px] font-medium text-[#5c4a3d]">Card</p>
                <div className="mt-2 h-1.5 w-24 rounded-full bg-[#e0d2c4]" />
                <div className="mt-1 h-1.5 w-28 rounded-full bg-[#e0d2c4]" />
                <div className="mt-2.5 inline-flex h-5 items-center rounded bg-[#d9bfa8] px-2 text-[7px] font-medium text-[#5c4a3d]">
                  Choose plan
                </div>
              </div>
              <div className="absolute left-[250px] top-9 hidden sm:block">
                <p className="text-[11px] text-white/55">Card</p>
                <p className="mt-0.5 font-mono text-[9px] text-white/30">240 × 160</p>
              </div>
              <div className="absolute inset-x-4 bottom-4 mx-auto max-w-[560px]">
                <Composer
                  value="Make the card 320 wide and set its fill to the honeycomb pattern"
                  state="focus"
                />
              </div>
            </div>
          </Stage>
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'height', value: '44 / 96 / 120px', note: 'one line → four' },
              { name: 'max width', value: '560px', note: 'centred in the viewport' },
              { name: 'surface', value: '#141418', note: 'border #27272f' },
              { name: 'radius', value: '12px', note: 'rounded-xl' },
              { name: 'textarea', value: '13px / 1.6', note: 'no resize handle' },
              { name: 'focus', value: '0 0 0 2px #52525b', note: 'never pink' },
              { name: 'dock inset', value: '16px', note: 'above the canvas edge' },
            ]}
          />
        </div>
      </Section>

      <Section title="States" note="focus · text · stop">
        <Tiles
          min={280}
          items={[
            { label: 'empty', note: 'send disabled', node: <Composer value="" /> },
            { label: 'typing', note: 'type to enable send', node: <Composer value={draft} onChange={setDraft} /> },
            {
              label: 'focused',
              note: '2px #52525b',
              node: <Composer value="Export this frame as SVG at 2×" state="focus" />,
            },
            {
              label: 'sending',
              note: 'stop',
              node: <Composer value="Apply the honeycomb pattern to both cards" state="sending" />,
            },
          ]}
        />
      </Section>

      <Usage
        when="The user wants a frame created, a fill changed, layers arranged or a selection exported. This is the only place a prompt is written, and it belongs beside the canvas it will change."
        rules={[
          'Dock at the bottom centre of the canvas, 16px above the edge, and cap the width at 560px.',
          'The placeholder is “Describe a change…”. Never put a sample prompt in it; the empty thread owns the examples.',
          'Send stays disabled until the prompt contains a non-whitespace character. Enter sends, Shift+Enter breaks the line.',
          'Attach, @ and / sit on the leading edge; / opens commands without a button of its own.',
          'The field grows to 120px and then scrolls. It never reflows the canvas or the side panels.',
          'While a turn runs the field stays editable for the next prompt, and the send control becomes stop.',
        ]}
        checks={[
          'The textarea has the label “Ask petals to change the canvas”; the placeholder is not a label.',
          'Enter sends outside IME composition; Shift+Enter always inserts a newline.',
          'The 2px #52525b focus ring is visible against the #141418 composer and the #0b0b0d canvas.',
          'Escape stops a running turn and returns focus to the textarea.',
        ]}
        edges={[
          'A pasted prompt over 4,000 characters truncates and shows a character count at the trailing edge.',
          'A mention whose layer was deleted turns into a missing token and blocks send with one reason line.',
          'A draft is kept per board and restored after reload; it is not shared with another board.',
          'A 320px-wide viewport keeps the composer 16px inside the canvas and moves / commands out of the row.',
          'Offline, send stays available but the turn starts with “Not sent — connection lost” and keeps the draft.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Send button ------------------------------ */

function SendButtonPage() {
  const [state, setState] = useState<SendState>('ready')
  const cycle = () => setState((s) => (s === 'ready' ? 'waiting' : s === 'waiting' ? 'streaming' : 'ready'))
  return (
    <Page
      title="Send button"
      lead="One 28px circle with four jobs: send, wait, stop, and refuse."
      spec
      meta="28px · 5 states · 700ms spinner"
    >
      <Section title="States" note="click send to cycle">
        <Tiles
          min={150}
          items={[
            { label: 'send', note: 'ready · click to cycle', node: <SendButton state={state} onClick={cycle} /> },
            { label: 'empty', note: 'muted · disabled', node: <SendButton state="empty" /> },
            { label: 'waiting', note: 'spinner', node: <SendButton state="waiting" /> },
            { label: 'streaming', note: 'stop', node: <SendButton state="streaming" /> },
            { label: 'reasoning', note: 'disabled', node: <SendButton state="reasoning" /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one circle">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'size', value: '28 × 28px', note: '32px hit area' },
            { name: 'radius', value: '9999px', note: 'always round' },
            { name: 'icon', value: '14px', note: 'stroke 2.2' },
            { name: 'ready', value: '#f472b6', note: 'icon #2b0a1c' },
            { name: 'empty', value: '#2b2b2b', note: 'icon #9a9aa4' },
            { name: 'spinner', value: '12px · 700ms linear', note: 'reduced motion: static' },
            { name: 'disabled', value: '45% opacity', note: 'aria-disabled, not removed' },
          ]}
        />
      </Section>

      <Usage
        when="Every prompt has exactly one send button, on the trailing edge of the composer. It is the only pink surface in the assistant chrome."
        rules={[
          'There is one per composer. A send button anywhere else is a second primary action.',
          'An empty prompt keeps the button in place at #2b2b2b and marks it aria-disabled; it never disappears and shifts the row.',
          'Sending replaces the arrow with a spinner. Streaming replaces the spinner with a stop square.',
          'Stop ends the stream, keeps the partial response, and labels the turn “Stopped”.',
          'Reasoning uses the same disabled surface as empty, with a pulsing dot; the prompt stays editable so the next send is one keystroke away.',
          'The button never carries a text label; its accessible name carries the verb.',
        ]}
        checks={[
          'The accessible name changes with the state: Send message, Sending, waiting for the first token, Stop response.',
          'The state change from waiting to stop is announced once through a polite live region.',
          'The 32px hit area applies on touch without changing the 28px visual.',
          '#2b0a1c on #f472b6 passes text contrast, and the stop glyph is not the only signal.',
        ]}
        edges={[
          'A double click sends once; the first press latches waiting and further clicks are ignored until the first token.',
          'A failed request returns the arrow, keeps the prompt text, and puts the error on the message, not the button.',
          'A stream that never produces a token still shows stop after 1s, so the turn can be cancelled.',
          'A prompt typed while a turn is running keeps the button on stop until the user types again.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Mention -------------------------------- */

function MentionChip({
  name,
  kind,
  active,
  missing,
  removable,
}: {
  name: string
  kind: 'frame' | 'layer' | 'image'
  active?: boolean
  missing?: boolean
  removable?: boolean
}) {
  const Icon = kind === 'frame' ? Frame : kind === 'layer' ? Layers : ImageIcon
  return (
    <span
      className={cn(
        'inline-flex h-[18px] max-w-full items-center gap-1 rounded-[4px] py-0 pl-1 pr-1 text-[10.5px]',
        missing
          ? 'border border-dashed border-[#ef4444]/50 text-[#ef4444]/90'
          : active
            ? 'bg-[#2b2b2b] text-foreground ring-1 ring-[#f472b6]/50'
            : 'bg-[#2b2b2b] text-foreground/85',
      )}
    >
      <Icon size={9} className="shrink-0 opacity-70" />
      <span className="truncate">{name}</span>
      {removable && (
        <button
          type="button"
          aria-label={`Remove mention ${name}`}
          className="flex size-3 shrink-0 cursor-pointer items-center justify-center rounded-sm text-white/40 hover:bg-white/10 hover:text-foreground"
        >
          <X size={8} />
        </button>
      )}
    </span>
  )
}

function MentionPicker() {
  const [active, setActive] = useState(1)
  const items = [
    { name: 'Hero', meta: 'Frame · Page 1', kind: 'frame' as const },
    { name: 'Card', meta: 'Frame · Page 1', kind: 'frame' as const },
    { name: 'Pricing heading', meta: 'Text · Card', kind: 'layer' as const },
    { name: 'honeycomb.png', meta: 'Image · Page 1', kind: 'image' as const },
  ]
  return (
    <div className="w-[268px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1a1a20] shadow-2xl shadow-black/40">
      <div className="px-2 pt-2">
        <div className="flex h-7 items-center gap-1.5 rounded-md bg-[#2b2b2b] px-2 text-[11.5px] text-foreground/85">
          <span className="font-mono text-[11px] text-[#f472b6]">@</span>
          <span className="min-w-0 flex-1 truncate">card</span>
          <span className="h-3.5 w-px animate-pulse bg-white/60" aria-hidden="true" />
        </div>
      </div>
      <div className="px-1 py-1.5" role="listbox" aria-label="Mention a layer">
        {items.map((it, i) => {
          const Icon = it.kind === 'frame' ? Frame : it.kind === 'layer' ? Type : ImageIcon
          return (
            <button
              key={it.name}
              type="button"
              role="option"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                'flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-1.5 text-left',
                active === i ? 'bg-[#232329]' : 'hover:bg-white/[0.04]',
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-white/10 bg-[#141418] text-[#9a9aa4]">
                {it.kind === 'image' ? <Honeycomb id="mention-thumb" className="size-full" /> : <Icon size={10} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] text-foreground/90">{it.name}</span>
                <span className="block truncate text-[9.5px] text-[#9a9aa4]">{it.meta}</span>
              </span>
              {active === i && <Check size={10} className="shrink-0 text-[#9a9aa4]" />}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 border-t border-[#27272f] px-2 py-1.5 text-[9.5px] text-white/40">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        <span>move</span>
        <Kbd>↵</Kbd>
        <span>choose</span>
        <span className="ml-auto flex items-center gap-1">
          <Kbd>esc</Kbd>
          <span>close</span>
        </span>
      </div>
    </div>
  )
}

function MentionPage() {
  return (
    <Page
      title="Mention"
      lead="Points the prompt at one frame, layer or image, by name."
      spec
      meta="18px chip · 268px picker · ↑↓ to choose"
    >
      <Section title="Chips" note="18px">
        <Tiles
          min={168}
          items={[
            { label: 'frame', note: '@frame', node: <MentionChip name="Hero" kind="frame" /> },
            { label: 'layer', note: '@layer', node: <MentionChip name="Pricing heading" kind="layer" /> },
            { label: 'image', note: '@image', node: <MentionChip name="honeycomb.png" kind="image" /> },
            { label: 'active', note: 'caret inside', node: <MentionChip name="Card" kind="frame" active /> },
            { label: 'removable', note: 'hover ×', node: <MentionChip name="Title" kind="layer" removable /> },
            { label: 'missing', note: 'deleted layer', node: <MentionChip name="Old card" kind="frame" missing /> },
          ]}
        />
      </Section>

      <Section title="Picker" note="268px · current page first">
        <Stage
          pad={false}
          className="flex justify-center px-6 py-8"
          caption="The picker opens above the caret, filters by name, and keeps the current page above other pages. Enter inserts a token; Escape leaves the text as typed."
        >
          <MentionPicker />
        </Stage>
      </Section>

      <Section title="Anatomy" note="token + list">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'chip height', value: '18px', note: 'one line only' },
            { name: 'chip font', value: '10.5px', note: 'Geist, not mono' },
            { name: 'chip padding', value: '4px left · 4px right', note: 'icon 9px' },
            { name: 'chip radius', value: '4px', note: 'squarer than a field' },
            { name: 'picker width', value: '268px', note: 'max 5 results' },
            { name: 'result row', value: '32px', note: 'thumbnail 20px' },
            { name: 'active ring', value: '#f472b6 / 50', note: 'active state only' },
          ]}
        />
      </Section>

      <Usage
        when="The prompt needs to name something on the canvas rather than describe it: a frame to resize, a layer to fill, an image to place. Typing @ at the caret opens the picker."
        rules={[
          'A mention stores the node id and renders the layer name; a renamed layer updates, a deleted one becomes missing.',
          'The picker lists frames, layers and images on the current page first, then the rest of the board, and searches by name.',
          'One token refers to one node. Never attach a group id and pretend it is the child the user pointed at.',
          'Backspace deletes a whole token, never one character of it; the × does the same with a label.',
          'The chip is 18px and stays inside the prompt line; it never wraps to two lines.',
          'A missing token blocks send and states which layer disappeared; it is never silently dropped.',
        ]}
        checks={[
          'The picker is a listbox with options; the active option is tracked with aria-activedescendant while focus stays in the textarea.',
          'A chip has an accessible name that includes its kind: “Mention Card, frame”.',
          'Up and Down move the picker, Enter inserts, Escape closes without inserting.',
          'The remove control has its own name and is reachable by Tab when the token is focused.',
        ]}
        edges={[
          'Duplicate layer names are disambiguated by the path in the secondary line, not by an id in the primary line.',
          'A board with 200 frames filters as the user types but keeps the first result within one frame.',
          'A mention of a layer on another page still resolves and names the page in the picker.',
          'Pasting the text “@Card” does not create a token; only the picker does.',
          'A mention inside a prompt that fails keeps its token and its missing state so the user can repair it.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Message -------------------------------- */

function ActionIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-6 cursor-pointer items-center justify-center rounded text-white/40 transition-colors hover:bg-white/[0.06] hover:text-foreground/80"
    >
      {children}
    </button>
  )
}

function MessageTurn({
  role,
  time,
  children,
  showActions,
  streaming,
}: {
  role: 'user' | 'assistant'
  time: string
  children: ReactNode
  showActions?: boolean
  streaming?: boolean
}) {
  const user = role === 'user'
  return (
    <div
      role="article"
      aria-label={user ? 'You' : 'petals'}
      className={cn('group flex w-full flex-col', user ? 'items-end' : 'items-start')}
    >
      {!user && (
        <div className="mb-1 flex items-center gap-1.5 text-[10.5px] text-white/45">
          <PetalMark size={11} />
          <span>petals</span>
        </div>
      )}
      <div
        className={cn(
          user
            ? 'max-w-[440px] rounded-[10px] bg-[#141418] px-3 py-2 text-[13px] leading-[1.6] text-[#e6e6ec]'
            : 'max-w-[520px] text-[13px] leading-[1.65] text-[#d6d6dd]',
        )}
      >
        {children}
        {streaming && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[13px] w-[2px] translate-y-[2px] animate-pulse bg-[#ececf1]"
          />
        )}
      </div>
      <div className={cn('mt-1 flex h-6 items-center gap-1', user && 'flex-row-reverse')}>
        <span className="px-1 font-mono text-[9.5px] text-white/35">{time}</span>
        <span
          className={cn(
            'flex items-center gap-0.5 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
          )}
        >
          <ActionIcon label="Copy message">
            <Copy size={11} />
          </ActionIcon>
          {!user && (
            <ActionIcon label="Retry this turn">
              <RotateCcw size={11} />
            </ActionIcon>
          )}
        </span>
      </div>
    </div>
  )
}

function MessagePage() {
  return (
    <Page
      title="Message"
      lead="One turn. The user gets a surface; the assistant gets the page."
      spec
      meta="13px · 2 alignments · 3 states"
    >
      <Section title="Styles" note="role">
        <Tiles
          min={320}
          items={[
            {
              label: 'user',
              note: 'right · surface',
              node: (
                <MessageTurn role="user" time="14:31">
                  Make the card 320 wide and set its fill to the honeycomb pattern.
                </MessageTurn>
              ),
            },
            {
              label: 'assistant',
              note: 'left · no bubble',
              node: (
                <MessageTurn role="assistant" time="14:32">
                  The card is 320 wide now. The honeycomb pattern is applied at 72px and the three
                  children reflowed with it.
                </MessageTurn>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="hover · stream · stopped">
        <Tiles
          min={280}
          items={[
            {
              label: 'actions',
              note: 'hover or focus',
              node: (
                <MessageTurn role="assistant" time="14:32" showActions>
                  The card is 320 wide now. Four layers were touched.
                </MessageTurn>
              ),
            },
            {
              label: 'streaming',
              note: 'caret',
              node: (
                <MessageTurn role="assistant" time="14:32" streaming>
                  Made the card 320 wide and set its fill to the honeycomb pattern.
                </MessageTurn>
              ),
            },
            {
              label: 'stopped',
              note: 'keeps partial text',
              node: (
                <MessageTurn role="assistant" time="14:33">
                  <p>Made the card 320 wide and set its fill to the honeycomb pattern.</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#ef4444]">
                    <X size={11} />
                    Stopped before the pattern finished. The resize is on the receipt; the fill is
                    unchanged.
                  </p>
                </MessageTurn>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one turn">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'max width', value: '520px', note: 'both roles' },
            { name: 'user surface', value: '#141418', note: 'radius 10px' },
            { name: 'user padding', value: '8px 12px', note: 'no tail' },
            { name: 'assistant surface', value: 'none', note: 'no avatar image' },
            { name: 'body', value: '13px / 1.65', note: 'Geist' },
            { name: 'gap', value: '20px', note: 'between turns' },
            { name: 'timestamp', value: '9.5px mono · white/35', note: 'one per message' },
            { name: 'actions', value: '24px', note: 'copy, retry' },
          ]}
        />
      </Section>

      <Usage
        when="A single exchange belongs in the conversation: one prompt from the user or one answer from petals. Use the message component whenever the thread needs to show who said what without a chat bubble on both sides."
        rules={[
          'The assistant has no bubble and no avatar image; a 12px petal mark and the name carry the author.',
          'The user sits right, on one #141418 surface, and never gets a tail or a second bubble.',
          '13px over 1.65 line height; values, commands and ids switch to Geist Mono at the same size.',
          'One timestamp per message at the outer edge, 9.5px mono. It never sits inside the text.',
          'Copy and retry live under the message, appear on hover and keyboard focus, and are never pink.',
          'A stopped or failed turn keeps its partial text and adds one plain line naming what did not run.',
        ]}
        checks={[
          'Each turn is an article labelled by its author, inside the thread log.',
          'The hover actions are also revealed by focus-within, so they are reachable without a pointer.',
          'Copy announces “Message copied” and retry keeps focus on the same message after the rerun starts.',
          'A timestamp carries a machine-readable datetime and does not rely on colour.',
        ]}
        edges={[
          'A 4,000-character message wraps without widening the column; code blocks scroll inside themselves.',
          'Retry replaces the turn in place rather than appending a duplicate; the old answer is one undo step away.',
          'A stopped turn with no text shows “Stopped” alone, not an empty bubble.',
          'An assistant message with a 40-line code block keeps the actions below it, not beside it.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Conversation ----------------------------- */

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px flex-1 bg-[#27272f]" />
      <span className="font-mono text-[9px] text-white/35">{label}</span>
      <span className="h-px flex-1 bg-[#27272f]" />
    </div>
  )
}

function ConversationPage() {
  return (
    <Page
      title="Conversation"
      lead="The thread, from the first prompt to the latest change."
      spec
      meta="640px column · 20px turns · 120px jump threshold"
    >
      <Section title="Thread" note="scrolling">
        <Stage
          pad={false}
          caption="Pinned to the latest only while the reader is at the bottom. Scrolling up keeps the position and raises the jump control; streaming never steals it back."
        >
          <div className="relative h-[380px] overflow-hidden bg-[#0b0b0d]">
            <div className="mx-auto flex h-full w-full max-w-[440px] flex-col gap-4 px-4 pb-14 pt-6">
              <DaySeparator label="Today" />

              <div className="flex justify-end">
                <div className="max-w-[300px] rounded-[10px] bg-[#141418] px-3 py-2 text-[12.5px] leading-[1.6] text-[#e6e6ec]">
                  Make the card 320 wide and set its fill to the honeycomb pattern.
                </div>
              </div>

              <div className="max-w-[360px]">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-white/45">
                  <PetalMark size={10} />
                  <span>petals</span>
                </div>
                <p className="text-[12.5px] leading-[1.65] text-[#d6d6dd]">
                  Made the card 320 wide and set its fill to the honeycomb pattern. The three children
                  reflowed with it.
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-[#9a9aa4]">
                  <Check size={10} />
                  <span>3 changes · 2s</span>
                  <span className="text-white/25">·</span>
                  <span className="underline decoration-white/20 underline-offset-2">Receipt</span>
                </div>
              </div>

              <div className="max-w-[340px]">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-white/45">
                  <PetalMark size={10} />
                  <span>petals</span>
                </div>
                <p className="text-[12.5px] leading-[1.65] text-white/55">
                  Applying the same pattern to the other two cards
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-[12px] w-[2px] translate-y-[2px] animate-pulse bg-[#ececf1]"
                  />
                </p>
                <button
                  type="button"
                  className="mt-1 h-6 cursor-pointer rounded px-1.5 text-[10.5px] text-white/45 hover:bg-white/5 hover:text-foreground/70"
                >
                  Stop
                </button>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0b0b0d] to-transparent" />
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <button
                type="button"
                className="inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-full bg-[#232329] px-2.5 text-[10.5px] text-foreground/80 shadow-lg shadow-black/40 ring-1 ring-white/10 hover:bg-[#2b2b34]"
              >
                <ArrowDown size={11} />
                Jump to latest
              </button>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Empty" note="first prompt">
        <Tiles
          min={280}
          items={[
            {
              label: 'empty thread',
              note: 'board-specific starters',
              wide: true,
              node: (
                <div className="flex w-full max-w-[420px] flex-col items-center py-2 text-center">
                  <span className="flex size-8 items-center justify-center rounded-full border border-[#27272f] bg-[#141418] text-[#9a9aa4]">
                    <PetalMark size={14} />
                  </span>
                  <p className="mt-3 text-[13px] text-foreground/85">Ask for a change to this board.</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-[#9a9aa4]">
                    It edits through commands, so every change is undoable.
                  </p>
                  <div className="mt-3 flex w-full flex-col gap-1">
                    {[
                      'Create a 390 × 844 frame for the checkout screen',
                      'Tidy the layers inside Card',
                      'Export the selected frame as SVG',
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="h-7 w-full cursor-pointer truncate rounded-md border border-[#27272f] px-2.5 text-left text-[11.5px] text-foreground/75 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="the thread">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'column', value: '640px', note: 'gutter 24px' },
            { name: 'turn gap', value: '20px', note: 'same for roles' },
            { name: 'day separator', value: '9px mono', note: 'local date' },
            { name: 'streaming anchor', value: '12px caret', note: 'one live tail' },
            { name: 'jump control', value: '26px', note: 'appears past 120px' },
            { name: 'autoscroll', value: '220ms', note: 'ease-out' },
            { name: 'virtualise', value: 'past 60 turns', note: 'keep the anchor' },
          ]}
        />
      </Section>

      <Usage
        when="The board has a running conversation about it. The thread is per board, survives reload, and is the only place a turn's response, activity and receipt appear together."
        rules={[
          'Autoscroll only while the reader is within 120px of the bottom; never yank a reader who scrolled up.',
          'A day separator appears when the local date changes, not every N turns.',
          'The empty state offers three prompts about this board — its frames, its layers, its export — never generic chat starters.',
          'One live region covers the streaming tail; finished turns are not re-announced.',
          'Switching boards swaps the thread and restores that board’s last scroll position.',
          'A turn’s response, activity and receipt stay in that order and are never split across days.',
        ]}
        checks={[
          'The thread is a log with aria-live=polite; aria-busy is true only while a turn streams.',
          'Jump to latest is a real button and moves focus to the newest message without trapping it.',
          'Reduced motion turns the 220ms autoscroll into an instant jump.',
          'Page Up and Page Down scroll the thread, not the page, while the thread has focus.',
        ]}
        edges={[
          'Two hundred turns virtualise while keeping the day separators and the jump target stable.',
          'A reload restores the thread and the position, not only the latest message.',
          'A turn that finishes after midnight lands under a new day separator without moving the old turns.',
          'A stopped turn stays in place and is not retried automatically.',
          'A deleted board closes the thread and says so; it never leaves an orphaned composer.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Response -------------------------------- */

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[3px] bg-[#2b2b2b] px-1 py-0.5 font-mono text-[11px] text-[#e6e6ec]">
      {children}
    </code>
  )
}

function ResponseBody({ size = 'default' }: { size?: 'default' | 'sm' }) {
  const sm = size === 'sm'
  return (
    <div
      className={cn(
        'w-full max-w-[600px] space-y-2.5 text-[#d6d6dd]',
        sm ? 'text-[12px] leading-[1.65]' : 'text-[13px] leading-[1.7]',
      )}
    >
      {sm ? (
        <>
          <p>
            Exported <InlineCode>Hero</InlineCode> as SVG and PNG at 2×. Two files, 41 kB total.
          </p>
          <p>The frame was already on Page 1; nothing else in the document changed.</p>
        </>
      ) : (
        <>
          <p>Made the card 320 wide and set its fill to the honeycomb pattern.</p>
          <p>
            The tile is anchored to the shape, so the motif stays centred at any width. The title, body
            and button reflowed with it; the 8px radius and the text colour are unchanged.
          </p>
          <p>Four layers were touched:</p>
          <ul className="space-y-1">
            {[
              ['Card', 'width 240 → 320'],
              ['Card', 'fill replaced with honeycomb at 72px'],
              ['Title, Body, Button', 'reflowed 80px right'],
            ].map(([name, change]) => (
              <li key={change} className="flex gap-2">
                <span className="mt-[9px] size-1 shrink-0 rounded-full bg-white/35" />
                <span>
                  <span className="text-foreground/90">{name}</span>
                  <span className="text-white/30"> — </span>
                  {change}
                </span>
              </li>
            ))}
          </ul>
          <p>
            <InlineCode>apply_pattern</InlineCode> wrote the fill in the same transaction as the
            resize, so one undo returns all four:
          </p>
          <pre className="overflow-x-auto rounded-md border border-[#27272f] bg-[#08080a] px-3 py-2 font-mono text-[10.5px] leading-relaxed text-[#c9c9d2]">
            <code>{`apply_pattern {
  id: "kQ2m8Xa1",
  motif: "honeycomb",
  scale: 72
}`}</code>
          </pre>
        </>
      )}
    </div>
  )
}

function ResponsePage() {
  return (
    <Page
      title="Response"
      lead="The answer, sized to read beside the canvas it changed."
      spec
      meta="13 / 12px · 3 states · 62ch"
    >
      <Section title="Sizes" note="13 / 12px">
        <Tiles
          min={320}
          items={[
            { label: 'default', note: '13px / 1.7', wide: true, node: <ResponseBody /> },
            {
              label: 'sm',
              note: '12px / 1.65 · narrow panel',
              wide: true,
              node: <ResponseBody size="sm" />,
            },
          ]}
        />
      </Section>

      <Section title="States" note="settled · streaming · pending">
        <Tiles
          min={240}
          items={[
            {
              label: 'settled',
              note: 'no decoration',
              node: (
                <p className="max-w-[300px] text-[12.5px] leading-[1.65] text-[#d6d6dd]">
                  The card is 320 wide. Four layers touched, one undo.
                </p>
              ),
            },
            {
              label: 'streaming',
              note: 'caret',
              node: (
                <p className="max-w-[300px] text-[12.5px] leading-[1.65] text-[#d6d6dd]">
                  The card is 320 wide
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-[13px] w-[2px] translate-y-[2px] animate-pulse bg-[#ececf1]"
                  />
                </p>
              ),
            },
            {
              label: 'pending',
              note: 'tag above',
              node: (
                <div className="max-w-[300px]">
                  <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-dashed border-[#27272f] px-2 text-[10px] text-[#9a9aa4]">
                    <Dot size={5} color="#9a9aa4" pulse />
                    Applying 2 changes
                  </span>
                  <p className="mt-1.5 text-[12.5px] text-[#9a9aa4]">Resizing the card…</p>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="prose">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'measure', value: '62ch', note: 'max 600px' },
            { name: 'body', value: '13px / 1.7', note: 'sm 12 / 1.65' },
            { name: 'paragraph gap', value: '10px', note: 'no blank lines' },
            { name: 'list gap', value: '4px', note: '1px dot bullet' },
            { name: 'inline code', value: '11px mono · #2b2b2b', note: 'radius 3px' },
            { name: 'code block', value: '10.5px mono · #08080a', note: 'scroll, never wrap' },
            { name: 'pending tag', value: '22px', note: 'dashed hairline' },
          ]}
        />
      </Section>

      <Usage
        when="The assistant has finished a turn and needs to say what changed, what it left alone, and which command did it. Read-only answers use the same shape without a receipt."
        rules={[
          'Lead with what changed in the document, in the user’s nouns: “Made the card 320 wide…”',
          'Never greet, never restate the prompt, never close with an offer to help.',
          'Quote the values the commands actually wrote. If a command failed, name it and say what remains.',
          'Code appears only when the user can reuse it: a command and its args, a hex, a selector.',
          'Link the receipt when more than one layer changed; do not repeat the receipt in prose.',
          '13px is the default. 12px is only for a response inside a narrow panel, never for emphasis.',
        ]}
        checks={[
          'Paragraphs, lists and code stay in reading order; a code block is announced as code.',
          'The streaming caret is aria-hidden and the live region carries only the tail text.',
          'Pending and settled are announced once; the tag is not a second live region.',
          'Prose and inline code keep at least 4.5:1 contrast against #0b0b0d.',
        ]}
        edges={[
          'A prompt that needs no change answers “Nothing changed — the card is already 320 wide.”',
          'A failed command keeps the successful paragraphs and adds the failure at the point it happened.',
          'A six-paragraph answer stays in one response; only a new turn starts a new message.',
          'A code block wider than the column scrolls inside its own box without widening the thread.',
          'A user who asks for “more detail” gets a longer answer in the same message, not a second assistant turn.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Reasoning ------------------------------- */

function ReasoningBlock({
  initialOpen = false,
  state = 'done',
}: {
  initialOpen?: boolean
  state?: 'done' | 'thinking'
}) {
  const [open, setOpen] = useState(initialOpen)
  const steps = [
    'Read the selection: Card, Title, Body, Button',
    'Checked the card’s fill and 8px radius',
    'Chose honeycomb at 72px; it keeps the radius',
  ]
  return (
    <div className="w-full max-w-[420px]">
      <button
        type="button"
        aria-expanded={state === 'thinking' ? false : open}
        onClick={() => state === 'done' && setOpen((v) => !v)}
        className="flex h-5 cursor-pointer items-center gap-1.5 rounded text-[11px] text-[#9a9aa4] transition-colors hover:text-foreground/70"
      >
        {state === 'thinking' ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <ChevronRight size={11} className={cn('transition-transform duration-150', open && 'rotate-90')} />
        )}
        <span>{state === 'thinking' ? 'Thinking' : 'Thought for 4s'}</span>
      </button>
      {state === 'done' && open && (
        <ul className="mt-1.5 ml-[5px] space-y-1 border-l border-[#27272f] pl-3">
          {steps.map((s) => (
            <li key={s} className="text-[11px] leading-[1.5] text-[#9a9aa4]">
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReasoningPage() {
  return (
    <Page
      title="Reasoning"
      lead="A short record of what it checked, folded away by default."
      spec
      meta="11px · 4s summary · 3 steps"
    >
      <Section title="States" note="expand the first tile">
        <Tiles
          min={260}
          items={[
            { label: 'collapsed', note: 'click to expand', node: <ReasoningBlock /> },
            { label: 'expanded', note: '3 steps', node: <ReasoningBlock initialOpen /> },
            { label: 'running', note: 'no steps yet', node: <ReasoningBlock state="thinking" /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one folded line">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'summary', value: '11px · #9a9aa4', note: 'sentence case' },
            { name: 'summary height', value: '20px', note: 'whole line is the target' },
            { name: 'chevron', value: '11px', note: 'rotates 90°' },
            { name: 'step text', value: '11px / 1.5', note: 'max 3 lines' },
            { name: 'indent', value: '12px', note: '1px rule at #27272f' },
            { name: 'step gap', value: '4px', note: 'no bullets' },
            { name: 'max width', value: '420px', note: 'never full column' },
          ]}
        />
      </Section>

      <Usage
        when="The turn ran commands or made a choice the user may want to audit. The block sits between the prompt and the response and never replaces the answer."
        rules={[
          'Collapsed once settled. While running it shows “Thinking” with no invented steps.',
          'The summary states time only — “Thought for 4s”. No token counts, confidence or model names.',
          'A step describes an action or a check (“Read the selection”, “Checked the fill”), never inner monologue.',
          'Reasoning is never the answer: one 11px line above the response, not a panel.',
          'If nothing verifiable happened, omit the block entirely rather than inventing a step.',
          'A failed command’s step stays visible with its failure; history is not rewritten after the fact.',
        ]}
        checks={[
          'The summary is a button with aria-expanded and aria-controls; the step list has a matching id.',
          'Expanding does not move focus; the next Tab reaches the first interactive element after the block.',
          'Steps are plain list text and are not announced one by one through a live region.',
          'The thinking spinner respects reduced motion and the label still says Thinking.',
        ]}
        edges={[
          'Under one second the summary reads “Thought”, with no “0s”.',
          'A step longer than three lines truncates with the full text in its title.',
          'A turn that stops before any step shows no summary at all.',
          'Reasoning from a reloaded thread stays collapsed, even if it was open before reload.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Tool call ------------------------------- */

type ToolState = 'running' | 'done' | 'failed'

function ToolRow({
  command,
  target,
  state,
  detail,
  args,
  result,
  defaultOpen = false,
}: {
  command: string
  target: string
  state: ToolState
  detail?: string
  args: Array<[string, string]>
  result: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [retrying, setRetrying] = useState(false)
  const current: ToolState = retrying ? 'running' : state
  return (
    <div className="w-full max-w-[520px] border-b border-[#27272f]/80 last:border-b-0">
      <div className="flex h-8 items-center gap-1.5">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Hide details for ${command}` : `Show details for ${command}`}
          onClick={() => setOpen((v) => !v)}
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#9a9aa4] transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <ChevronRight size={11} className={cn('transition-transform', open && 'rotate-90')} />
        </button>
        <Terminal size={12} className="shrink-0 text-[#9a9aa4]" />
        <code className="shrink-0 font-mono text-[11px] text-[#ececf1]">{command}</code>
        <span className="min-w-0 flex-1 truncate pl-1 text-[11.5px] text-[#9a9aa4]">{target}</span>
        {current === 'running' && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#9a9aa4]">
            <Loader2 size={10} className="animate-spin" />
            Running
          </span>
        )}
        {current === 'done' && (
          <span className="flex shrink-0 items-center gap-1 font-mono text-[9.5px] text-white/40">
            <Check size={10} className="text-[#9a9aa4]" />
            {detail}
          </span>
        )}
        {current === 'failed' && (
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#ef4444]">
            <X size={10} />
            Failed
          </span>
        )}
      </div>
      {open && (
        <div className="mb-2 ml-[26px] rounded-md border border-[#27272f]/70 bg-[#08080a] px-2.5 py-2">
          <div className="space-y-0.5">
            {args.map(([k, v]) => (
              <div key={k} className="flex gap-2 font-mono text-[10px] leading-[1.7]">
                <span className="w-14 shrink-0 text-white/35">{k}</span>
                <span className="min-w-0 break-all text-[#c9c9d2]">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 border-t border-[#27272f]/70 pt-1.5 text-[10.5px] text-[#9a9aa4]">
            {retrying ? 'Re-running with the same arguments.' : result}
          </div>
          {state === 'failed' && !retrying && (
            <button
              type="button"
              onClick={() => setRetrying(true)}
              className="mt-1.5 inline-flex h-6 cursor-pointer items-center gap-1 rounded border border-[#27272f] px-1.5 text-[10.5px] text-foreground/80 transition-colors hover:bg-white/5"
            >
              <RotateCcw size={10} />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ToolCallPage() {
  return (
    <Page
      title="Tool call"
      lead="One command, its target, and what came back."
      spec
      meta="32px row · 3 states · mono command"
    >
      <Section title="Commands" note="one row per command">
        <Tiles
          min={320}
          items={[
            {
              label: 'set_fill',
              note: 'done',
              node: (
                <ToolRow
                  command="set_fill"
                  target="Card"
                  state="done"
                  detail="18ms"
                  args={[
                    ['id', '"kQ2m8Xa1"'],
                    ['fill', '"#141418"'],
                  ]}
                  result="Fill updated · 1 layer · one transaction"
                />
              ),
            },
            {
              label: 'apply_pattern',
              note: 'running',
              node: (
                <ToolRow
                  command="apply_pattern"
                  target="Card"
                  state="running"
                  args={[
                    ['motif', '"honeycomb"'],
                    ['scale', '72'],
                  ]}
                  result="Writing the fill…"
                />
              ),
            },
            {
              label: 'create_frame',
              note: 'done',
              node: (
                <ToolRow
                  command="create_frame"
                  target="Pricing"
                  state="done"
                  detail="31ms"
                  args={[
                    ['w', '320'],
                    ['h', '240'],
                  ]}
                  result={'Created frame “Pricing” on Page 1'}
                />
              ),
            },
            {
              label: 'export_selection',
              note: 'failed · retry',
              node: (
                <ToolRow
                  command="export_selection"
                  target="Hero"
                  state="failed"
                  args={[
                    ['ids', '["kQ2m8Xa1"]'],
                    ['kinds', '["svg", "png2x"]'],
                  ]}
                  result="Export failed — no exportable frame in the selection."
                  defaultOpen
                />
              ),
            },
          ]}
        />
      </Section>

      <Section title="Details" note="args + result">
        <Stage caption="The row is one line. Opening it reveals the exact arguments the command layer received and the result it returned, both in mono at 10px.">
          <div className="rounded-lg border border-[#27272f] bg-[#141418] px-3 py-1">
            <ToolRow
              command="apply_pattern"
              target="Card"
              state="done"
              detail="24ms"
              args={[
                ['id', '"kQ2m8Xa1"'],
                ['motif', '"honeycomb"'],
                ['scale', '72'],
                ['seed', '1'],
              ]}
              result="Fill updated · 1 layer · one transaction · undo id tx_8f21"
              defaultOpen
            />
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one command">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'row height', value: '32px', note: 'collapsed' },
            { name: 'command', value: '11px mono', note: 'as the command layer names it' },
            { name: 'target', value: '11.5px', note: 'layer name, not id' },
            { name: 'status', value: '10px', note: 'text + glyph' },
            { name: 'args panel', value: '#08080a', note: 'indent 26px' },
            { name: 'result', value: '10.5px', note: 'one line, then wraps' },
            { name: 'retry', value: '24px', note: 'same args only' },
          ]}
        />
      </Section>

      <Usage
        when="A turn ran one to three commands and the reader may want the exact call. A read-only answer uses none; a longer turn folds its commands into the activity summary."
        rules={[
          'One row per command in the order it ran; never merge two commands into one row.',
          'Use the command name exactly as the command layer does, and put the human sentence in the response.',
          'Always show the target layer name. The node id lives in the expanded arguments.',
          'Arguments are collapsed by default; a row is one line until the reader opens it.',
          'A failure shows the returned reason and one Retry. Retry reuses the same arguments and never guesses new ones.',
          'More than three commands in a turn become an activity summary with a receipt.',
        ]}
        checks={[
          'Status is written as text next to the glyph, never carried by colour alone.',
          'The disclosure button is named for the command it opens: “Show details for apply_pattern”.',
          'Running to done is announced once through the thread’s live region, not per argument.',
          'Arguments and results keep at least 4.5:1 contrast on #08080a at 10px.',
        ]}
        edges={[
          'A target deleted mid-run keeps its name in the row and marks the result “no longer in the document”.',
          'A data URL in the arguments truncates in the middle and offers the full value through a copy action.',
          'Retrying after undo creates a new transaction; it does not reuse the old undo id.',
          'An export on a board with no selected frame fails before writing any file.',
          'A command name this docs version does not know still renders; only the icon falls back to the terminal.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Activity ------------------------------- */

type ActivityVariant = 'done' | 'running' | 'stopped'
type StepState = ToolState | 'pending'

function ActivityBlock({ variant = 'done' }: { variant?: ActivityVariant }) {
  const [open, setOpen] = useState(variant !== 'done')
  const summary =
    variant === 'done' ? '3 changes · 2s' : variant === 'running' ? 'Working · 2 of 3' : 'Stopped · 1 failed'
  const steps: Array<{ command: string; target: string; detail: string; state: StepState }> = [
    { command: 'set_size', target: 'Card', detail: '12ms', state: 'done' },
    {
      command: 'apply_pattern',
      target: 'Card · honeycomb',
      detail: '24ms',
      state: variant === 'running' ? 'running' : 'done',
    },
    {
      command: 'arrange_layers',
      target: 'Card · 3 children',
      detail: variant === 'running' ? '' : '8ms',
      state: variant === 'stopped' ? 'failed' : variant === 'running' ? 'pending' : 'done',
    },
  ]
  return (
    <div className="w-full max-w-[420px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 cursor-pointer items-center gap-1.5 rounded text-[#9a9aa4] transition-colors hover:text-foreground/75"
      >
        <ChevronRight size={11} className={cn('shrink-0 transition-transform', open && 'rotate-90')} />
        <span className="text-[11.5px]">{summary}</span>
        {variant === 'running' && <Loader2 size={10} className="animate-spin" />}
      </button>
      {open && (
        <div className="mt-1 ml-[5px] border-l border-[#27272f] pl-3">
          {steps.map((st) => (
            <div key={st.command} className="flex h-6 items-center gap-1.5 text-[10.5px]">
              <span className="flex size-3 shrink-0 items-center justify-center">
                {st.state === 'done' && <Check size={9} className="text-[#9a9aa4]" />}
                {st.state === 'running' && <Loader2 size={9} className="animate-spin text-[#9a9aa4]" />}
                {st.state === 'failed' && <X size={9} className="text-[#ef4444]" />}
                {st.state === 'pending' && <span className="size-1 rounded-full bg-white/20" />}
              </span>
              <code className="shrink-0 font-mono text-[10.5px] text-foreground/80">{st.command}</code>
              <span className="min-w-0 flex-1 truncate text-[#9a9aa4]">{st.target}</span>
              <span
                className={cn(
                  'shrink-0 font-mono text-[9.5px]',
                  st.state === 'failed' ? 'text-[#ef4444]' : 'text-white/35',
                )}
              >
                {st.state === 'failed' ? 'Failed' : st.detail || 'Waiting'}
              </span>
            </div>
          ))}
          {variant !== 'running' && (
            <button
              type="button"
              className="mt-1 inline-flex h-6 cursor-pointer items-center gap-1 rounded px-1 text-[10.5px] text-foreground/75 hover:bg-white/5 hover:text-[#f472b6]"
            >
              {variant === 'stopped' ? 'Review changes' : 'View receipt'}
              <ArrowUpRight size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ActivityPage() {
  return (
    <Page
      title="Activity"
      lead="A multi-command turn, folded into one line and a receipt."
      spec
      meta="3 commands · 2s · collapsible"
    >
      <Section title="States" note="expand the first tile">
        <Tiles
          min={280}
          items={[
            { label: 'settled', note: 'click to expand', node: <ActivityBlock /> },
            { label: 'running', note: '2 of 3', node: <ActivityBlock variant="running" /> },
            { label: 'stopped', note: 'one failed', node: <ActivityBlock variant="stopped" /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="summary + steps">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'summary', value: '11.5px', note: 'count + duration' },
            { name: 'summary height', value: '24px', note: 'whole line toggles' },
            { name: 'step row', value: '24px', note: 'one command each' },
            { name: 'indent', value: '12px', note: '1px rule at #27272f' },
            { name: 'command', value: '10.5px mono', note: 'same names as tool call' },
            { name: 'duration', value: '9.5px mono', note: 'per step, right aligned' },
            { name: 'receipt link', value: '10.5px', note: 'last line only' },
          ]}
        />
      </Section>

      <Usage
        when="One turn wrote to the document through more than one command. The summary keeps the thread quiet; opening it shows exactly which commands ran and what each touched."
        rules={[
          'Group only commands from the same turn and the same transaction boundary.',
          'The summary counts successful changes, not attempts; the duration is wall-clock, rounded to seconds.',
          'Collapsed once settled. Open while running and after a failure, when the detail matters.',
          'One line per command: name, target, status. Arguments stay in the tool-call row.',
          'End with the receipt link when the turn wrote to the document; read-only turns show no activity.',
          'A stopped turn keeps the completed steps and marks the failure. It never claims the commands it did not run.',
        ]}
        checks={[
          'The summary is a disclosure button with aria-expanded and a labelled step list.',
          'The count is announced once when the turn settles, not on every step.',
          'Each step’s status is written as text, so success and failure do not rely on colour.',
          'The receipt link is reachable by Tab and its focus ring is visible on #0b0b0d.',
        ]}
        edges={[
          'A turn with 20 commands shows the first eight and a “View all 20” link.',
          'Undo during a run stops the remaining commands and marks the summary “Stopped”.',
          'A failure in the middle keeps earlier steps done and leaves later steps unlisted rather than pending.',
          'A reload while running marks the turn stopped; it never restarts commands on its own.',
          'Two turns with the same three commands keep separate summaries and separate receipts.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Follow-ups ------------------------------ */

function FollowUpsPage() {
  const [picked, setPicked] = useState<string | null>(null)
  const items = ['Apply it to the other two cards', 'Try a 96px honeycomb', 'Export the card as SVG']
  const chip = (label: string) => (
    <button
      key={label}
      type="button"
      aria-pressed={picked === label}
      title={label}
      onClick={() => setPicked(label)}
      className={cn(
        'inline-flex h-7 max-w-full shrink-0 cursor-pointer items-center truncate rounded-full border px-2.5 text-[11.5px] transition-colors',
        picked === label
          ? 'border-[#f472b6]/40 bg-[#f472b6]/[0.06] text-[#f472b6]'
          : 'border-[#27272f] text-[#d6d6dd] hover:border-white/20 hover:bg-white/[0.04]',
      )}
    >
      {label}
    </button>
  )
  return (
    <Page
      title="Follow-ups"
      lead="Two to four next moves the assistant can actually make."
      spec
      meta="28px · 2–4 chips · one line each"
    >
      <Section title="Styles" note="click to select">
        <Tiles
          min={280}
          items={[
            {
              label: 'row',
              note: '3 suggestions',
              wide: true,
              node: <div className="flex w-full max-w-[560px] items-center gap-1.5">{items.map(chip)}</div>,
            },
            {
              label: 'pair',
              note: 'two next moves',
              wide: true,
              node: (
                <div className="flex w-full max-w-[560px] items-center gap-1.5">
                  {chip('Undo the pattern')}
                  {chip('Apply it to the other two cards')}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="rest · hover · selected">
        <Tiles
          min={200}
          items={[
            {
              label: 'rest',
              note: 'quiet outline',
              node: (
                <span className="inline-flex h-7 items-center rounded-full border border-[#27272f] px-2.5 text-[11.5px] text-[#d6d6dd]">
                  Export the card as SVG
                </span>
              ),
            },
            {
              label: 'hover',
              note: 'white/5',
              node: (
                <span className="inline-flex h-7 items-center rounded-full border border-white/20 bg-white/[0.04] px-2.5 text-[11.5px] text-[#d6d6dd]">
                  Export the card as SVG
                </span>
              ),
            },
            {
              label: 'selected',
              note: 'fills composer',
              node: (
                <span className="inline-flex h-7 items-center rounded-full border border-[#f472b6]/40 bg-[#f472b6]/[0.06] px-2.5 text-[11.5px] text-[#f472b6]">
                  Export the card as SVG
                </span>
              ),
            },
            {
              label: 'truncated',
              note: 'one line',
              node: (
                <span
                  title="Apply the honeycomb pattern to the other two cards at 96px"
                  className="inline-flex h-7 max-w-[220px] items-center truncate rounded-full border border-[#27272f] px-2.5 text-[11.5px] text-[#d6d6dd]"
                >
                  Apply the honeycomb pattern to the other two cards at 96px
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one chip">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'height', value: '28px', note: 'radius full' },
            { name: 'padding', value: '10px', note: 'horizontal only' },
            { name: 'font', value: '11.5px', note: 'sentence case' },
            { name: 'border', value: '#27272f', note: 'hover white/20' },
            { name: 'gap', value: '6px', note: 'between chips' },
            { name: 'count', value: '2–4', note: 'never more' },
            { name: 'click', value: 'fills composer', note: 'never sends' },
          ]}
        />
      </Section>

      <Usage
        when="A settled turn changed the document and there is an obvious next move on the same objects. Follow-ups sit under the response and disappear when the next prompt is sent."
        rules={[
          'Two to four suggestions, ordered by what the user is most likely to want next.',
          'Each one names a real object or value from this turn: “Apply it to the other two cards”, not “Make it responsive”.',
          'Verb first, sentence case, at most 48 characters, and always one line.',
          'Clicking fills the composer and focuses it; it never sends without a second press.',
          'Never repeat the prompt the user just sent, and never attach follow-ups to a failed turn.',
          'Clear the row when the next prompt is sent; stale suggestions are worse than none.',
        ]}
        checks={[
          'The row is a labelled group of buttons, “Suggested next”.',
          'Each button’s accessible name is its full text, including any value it mentions.',
          'The selected state uses aria-pressed and pink text, not colour alone.',
          'A truncated chip exposes its full text in the accessible name and on hover.',
        ]}
        edges={[
          'Under 360px the row shows the first two chips rather than wrapping to two lines.',
          'A localised chip longer than 48 characters truncates at the tile edge and keeps its title.',
          'After an undo, the row is dropped instead of offering a move based on a change that no longer exists.',
          'A turn with no sensible next move shows no row at all.',
          'Clicking the same chip twice keeps one prompt in the composer, not two copies.',
        ]}
      />
    </Page>
  )
}

/* ------------------------------- Action receipt ---------------------------- */

function ActionReceipt({ variant = 'default' }: { variant?: 'default' | 'undone' | 'expired' }) {
  const [undone, setUndone] = useState(variant === 'undone')
  const expired = variant === 'expired'
  return (
    <div className="w-full max-w-[320px] rounded-lg border border-[#27272f] bg-[#141418] p-2.5">
      <div className="flex items-center gap-1.5">
        {undone ? (
          <Undo2 size={11} className="shrink-0 text-[#9a9aa4]" />
        ) : (
          <Check size={11} className="shrink-0 text-[#9a9aa4]" />
        )}
        <span className="min-w-0 truncate text-[11.5px] font-medium text-foreground/90">
          {undone ? 'Undone · 4 layers restored' : '4 layers · Fill, pattern, size'}
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5 font-mono text-[9.5px] leading-[1.6]">
        <div className="flex gap-2">
          <span className="w-8 shrink-0 text-white/30">board</span>
          <span className="min-w-0 truncate text-[#9a9aa4]">Sleepy-Walrus-3902</span>
        </div>
        <div className="flex gap-2">
          <span className="w-8 shrink-0 text-white/30">nodes</span>
          <span className="min-w-0 truncate text-[#9a9aa4]">kQ2m8Xa1 · q7Lm2Pz4 · b3Tn9Vr6 +1</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 border-t border-[#27272f] pt-1.5">
        {expired ? (
          <span className="text-[10.5px] text-white/35">Undo unavailable · 12 edits since</span>
        ) : (
          <button
            type="button"
            disabled={undone}
            aria-label={undone ? 'Changes undone' : 'Undo 4 layer changes'}
            onClick={() => setUndone(true)}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10.5px] font-medium transition-colors',
              undone ? 'text-white/35' : 'cursor-pointer text-[#f472b6] hover:bg-[#f472b6]/10',
            )}
          >
            <Undo2 size={11} />
            {undone ? 'Undone' : 'Undo'}
          </button>
        )}
        <button
          type="button"
          className="inline-flex h-6 cursor-pointer items-center gap-1 rounded px-1.5 text-[10.5px] text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground"
        >
          View changes
          <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  )
}

function ActionReceiptPage() {
  return (
    <Page
      title="Action receipt"
      lead="What changed, in the user’s nouns, with one way back."
      spec
      meta="4 layers · 3 property groups · survives reload"
    >
      <Section title="Attached" note="under the response">
        <Stage caption="The receipt is part of the message, not a toast. It stays attached after reload and its Undo runs the same transaction as ⌘Z.">
          <div className="mx-auto w-full max-w-[360px]">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] text-white/45">
              <PetalMark size={10} />
              <span>petals</span>
            </div>
            <p className="max-w-[320px] text-[12.5px] leading-[1.65] text-[#d6d6dd]">
              Four layers touched — the resize moved the title, body and button. The pattern is one
              transaction with the width.
            </p>
            <div className="mt-2">
              <ActionReceipt />
            </div>
            <p className="mt-1 font-mono text-[9.5px] text-white/35">14:32</p>
          </div>
        </Stage>
      </Section>

      <Section title="States" note="undo · reload · expired">
        <Tiles
          min={280}
          items={[
            { label: 'default', note: 'undo available', node: <ActionReceipt /> },
            { label: 'undone', note: 'restored', node: <ActionReceipt variant="undone" /> },
            { label: 'expired', note: 'later edits', node: <ActionReceipt variant="expired" /> },
            {
              label: 'after reload',
              note: 'same receipt',
              node: (
                <div className="w-full max-w-[320px]">
                  <ActionReceipt />
                  <p className="mt-1 text-[9.5px] text-white/30">Reopened 2 days later</p>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one receipt">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '320px', note: 'hugs the message' },
            { name: 'surface', value: '#141418', note: 'border #27272f' },
            { name: 'padding', value: '10px 12px', note: 'radius 8px' },
            { name: 'header', value: '11.5px / 500', note: 'count + groups' },
            { name: 'ids', value: '9.5px mono', note: 'board first' },
            { name: 'actions', value: '24px', note: 'Undo + View changes' },
            { name: 'node ids', value: '3 + “+n”', note: 'never a wall of ids' },
            { name: 'undo', value: '#f472b6', note: 'the only pink here' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A receipt is a view over the turn’s transaction, not a second history. If the transaction is
            no longer reachable, the receipt says so and leaves View changes available.
          </Note>
        </div>
      </Section>

      <Usage
        when="A turn wrote to the document. The receipt tells the reader how many layers changed, which properties moved, and how to take it back without hunting for the turn."
        rules={[
          'One receipt per turn that changed the document. Read-only answers get none.',
          'The header names the count and the property groups — “4 layers · Fill, pattern, size” — never “Success!”.',
          'Show the board name before the node ids; ids are mono 9.5px and capped at three plus “+n”.',
          'Undo is the same transaction as ⌘Z. It never restores a snapshot from another turn.',
          'The receipt attaches to its message and survives reload; it is history, not a transient toast.',
          'View changes opens the diff for the same node ids. It never reruns the turn.',
        ]}
        checks={[
          'The Undo button’s accessible name includes the count: “Undo 4 layer changes”.',
          'Undoing is announced once through a polite live region and focus stays on the receipt.',
          'Node ids are selectable text, not an image, and keep 4.5:1 contrast at 9.5px.',
          'View changes is an action with a visible focus ring, ordered after Undo.',
        ]}
        edges={[
          'If later edits make the transaction unreachable, Undo is disabled and one line says why.',
          'A partial undo restores the layers it can and names the ones it cannot.',
          'A turn that touched 40 layers shows three ids and “+37”, with the rest in View changes.',
          'An export-only turn lists the files it wrote instead of layer ids.',
          'A deleted board keeps the receipt text but disables both actions.',
        ]}
      />
    </Page>
  )
}

/* ------------------------------- Autonomy rule ----------------------------- */

type Permission = 'ask' | 'always' | 'never'

const PERMISSION_OPTIONS: Array<{ id: Permission; label: string }> = [
  { id: 'ask', label: 'Ask first' },
  { id: 'always', label: 'Always' },
  { id: 'never', label: 'Never' },
]

function PermissionSample({ selected }: { selected: Permission }) {
  return (
    <div className="grid w-full max-w-[252px] grid-cols-3 gap-1">
      {PERMISSION_OPTIONS.map((opt) => {
        const on = selected === opt.id
        return (
          <span
            key={opt.id}
            className={cn(
              'flex h-6 items-center justify-center gap-1 rounded-md text-[10px]',
              on ? 'bg-white/[0.07] text-[#f472b6]' : 'text-white/40',
            )}
          >
            <Check size={9} className={on ? 'opacity-100' : 'opacity-0'} />
            {opt.label}
          </span>
        )
      })}
    </div>
  )
}

function AutonomyRulePage() {
  const [rules, setRules] = useState<Record<string, Permission>>({
    delete: 'ask',
    export: 'always',
    publish: 'ask',
    spend: 'never',
  })
  const rows = [
    {
      id: 'delete',
      label: 'Delete layers',
      why: 'Removes the layer and its children. One undo step, for the session.',
      icon: <Trash2 size={12} />,
    },
    {
      id: 'export',
      label: 'Export selection',
      why: 'Writes files from the current selection. Nothing leaves the board.',
      icon: <FileDown size={12} />,
    },
    {
      id: 'publish',
      label: 'Publish board',
      why: 'Replaces the live page at its URL. Visible to anyone with the link.',
      icon: <Globe size={12} />,
    },
    {
      id: 'spend',
      label: 'Spend credits',
      why: 'Uses paid credits for a render or a generated image.',
      icon: <CreditCard size={12} />,
    },
  ]

  const move = (e: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const idx = PERMISSION_OPTIONS.findIndex((o) => o.id === rules[id])
    const step = e.key === 'ArrowRight' ? 1 : PERMISSION_OPTIONS.length - 1
    const next = (idx + step) % PERMISSION_OPTIONS.length
    setRules((r) => ({ ...r, [id]: PERMISSION_OPTIONS[next].id }))
    e.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <Page
      title="Autonomy rule"
      lead="What it may do alone, and what it must ask first."
      spec
      meta="4 actions · 3 rules · one selected each"
    >
      <Section title="Rules" note="per board">
        <Stage caption="Click an option to change the rule. The command layer reads it before it writes; the model never decides on its own whether a destructive action is allowed.">
          <div className="w-full max-w-[600px]">
            <div className="grid grid-cols-[1fr_246px] items-end gap-3 border-b border-[#27272f] pb-2">
              <span className="font-mono text-[9px] text-white/35">action</span>
              <div className="grid grid-cols-3 gap-1">
                {PERMISSION_OPTIONS.map((opt) => (
                  <span key={opt.id} className="text-center font-mono text-[9px] lowercase text-white/35">
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_246px] items-center gap-3 border-b border-[#27272f]/70 py-2.5 last:border-b-0"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[#9a9aa4]">{row.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-foreground/90">{row.label}</p>
                    <p className="mt-0.5 text-[10.5px] leading-[1.45] text-[#9a9aa4]">{row.why}</p>
                  </div>
                </div>
                <div
                  role="radiogroup"
                  aria-label={`${row.label} permission`}
                  onKeyDown={(e) => move(e, row.id)}
                  className="grid grid-cols-3 gap-1"
                >
                  {PERMISSION_OPTIONS.map((opt) => {
                    const on = rules[row.id] === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={on ? 0 : -1}
                        onClick={() => setRules((r) => ({ ...r, [row.id]: opt.id }))}
                        className={cn(
                          'flex h-6 cursor-pointer items-center justify-center gap-1 rounded-md text-[10px] transition-colors',
                          on
                            ? 'bg-white/[0.07] text-[#f472b6]'
                            : 'text-white/40 hover:bg-white/[0.04] hover:text-foreground/75',
                        )}
                      >
                        <Check size={9} className={on ? 'opacity-100' : 'opacity-0'} />
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p className="mt-2 text-[9.5px] text-white/30">
              Applies to this board. Account defaults live in Settings.
            </p>
          </div>
        </Stage>
      </Section>

      <Section title="States" note="selected · blocked">
        <Tiles
          min={260}
          items={[
            { label: 'ask first', note: 'default', node: <PermissionSample selected="ask" /> },
            { label: 'always', note: 'undoable only', node: <PermissionSample selected="always" /> },
            { label: 'never', note: 'blocked', node: <PermissionSample selected="never" /> },
            {
              label: 'blocked action',
              note: 'inline confirm',
              wide: true,
              node: (
                <div className="w-full max-w-[360px] rounded-lg border border-[#27272f] bg-[#141418] p-2.5">
                  <p className="text-[12px] text-foreground/90">Delete 2 layers?</p>
                  <p className="mt-0.5 text-[11px] leading-[1.5] text-[#9a9aa4]">
                    Card and its 1 child. This can be undone.
                  </p>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <Btn size="sm" variant="outline">
                      Cancel
                    </Btn>
                    <Btn size="sm" variant="danger">
                      Delete
                    </Btn>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one row">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'row height', value: '56px', note: 'grows with the explanation' },
            { name: 'action', value: '12.5px', note: 'noun + verb' },
            { name: 'explanation', value: '10.5px / 1.45', note: 'one line of consequence' },
            { name: 'option', value: '24px × 78px', note: '3 per row' },
            { name: 'selected', value: '#f472b6', note: 'white/7 surface + check' },
            { name: 'table', value: '600px max', note: 'hairline rows' },
            { name: 'confirm', value: '2 buttons', note: 'danger only on delete' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Ask first is the default for anything destructive or off-board. Always is only for commands
            the user can take back with one undo.
          </Note>
        </div>
      </Section>

      <Usage
        when="The assistant can take actions the user might not want repeated. The rule decides, per action, whether it asks, proceeds, or refuses before the command reaches the document."
        rules={[
          'Ask first is the default for delete, publish and anything that leaves the board.',
          'Always is only for commands one ⌘Z can take back. Never for delete, publish or spend.',
          'Never blocks the command in the command layer; the assistant says which rule stopped it.',
          'The rule is checked before the write, not guessed by the model from the prompt.',
          'One selected option per row. The explanation states the consequence in a single line.',
          'Changing a rule is a settings action, not something agreed inside a prompt.',
        ]}
        checks={[
          'Each row is a radiogroup named for its action; arrow keys move, Tab leaves the group.',
          'The selected option shows a check as well as pink text, so state is not colour alone.',
          'A blocked action is announced once, with the rule name and the action it refused.',
          'The confirm strip keeps focus on Cancel first and returns it to the composer on Escape.',
        ]}
        edges={[
          'A rule changed mid-turn does not affect the turn that already started; it applies to the next command.',
          'An export over 200 MB asks once for confirmation even when Export is set to Always.',
          'Publish with no live URL still asks, because the first publish creates one.',
          'Spend with zero credits refuses before showing a price.',
          'Undo after a delete allowed by Always restores the layers and leaves the rule unchanged.',
        ]}
      />
    </Page>
  )
}

export const aiPages: Record<string, ComponentType> = {
  'components/prompt-input': PromptInputPage,
  'components/send-button': SendButtonPage,
  'components/mention': MentionPage,
  'components/message': MessagePage,
  'components/conversation': ConversationPage,
  'components/response': ResponsePage,
  'components/reasoning': ReasoningPage,
  'components/tool-call': ToolCallPage,
  'components/activity': ActivityPage,
  'components/follow-ups': FollowUpsPage,
  'components/action-receipt': ActionReceiptPage,
  'components/autonomy-rule': AutonomyRulePage,
}
