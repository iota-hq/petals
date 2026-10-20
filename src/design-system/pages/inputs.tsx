import { useEffect, useRef, useState } from 'react'
import type {
  ClipboardEvent as ReactClipboardEvent,
  ComponentType,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react'
import {
  Blend,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Move,
  Plus,
  RotateCw,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Btn, Field, Kbd, PanelFrame, PanelSection } from '../bits'

/* ---------------------------------- Field ---------------------------------- */

function FieldPage() {
  return (
    <Page
      title="Field"
      lead="The row that frames a control: glyph, value, unit, and the affordance at the end."
      meta="3 sizes · 6 states · 28px default"
    >
      <Section title="Sizes" note="height">
        <Tiles
          min={204}
          items={[
            {
              label: 'panel',
              note: '28px',
              node: (
                <div className="w-[160px]">
                  <Field label="W" value="420" unit="px" />
                </div>
              ),
            },
            {
              label: 'dialog',
              note: '32px',
              node: (
                <div className="w-[160px]">
                  <Field label="W" value="420" unit="px" className="h-8 px-2.5" />
                </div>
              ),
            },
            {
              label: 'marketing',
              note: '40px',
              node: (
                <div className="w-[160px]">
                  <Field label="W" value="420" unit="px" className="h-10 px-3 text-[14px]" />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="rest → hover → focus → filled → disabled → error">
        <Tiles
          min={180}
          items={[
            {
              label: 'rest',
              note: 'empty',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value={<span className="text-muted-foreground/50">—</span>} />
                </div>
              ),
            },
            {
              label: 'hover',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value="420" unit="px" state="hover" />
                </div>
              ),
            },
            {
              label: 'focus',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value="420" unit="px" state="focus" />
                </div>
              ),
            },
            {
              label: 'filled',
              note: 'committed',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value="420" unit="px" />
                </div>
              ),
            },
            {
              label: 'disabled',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value="420" unit="px" state="disabled" />
                </div>
              ),
            },
            {
              label: 'error',
              note: 'invalid',
              node: (
                <div className="w-[136px]">
                  <Field label="W" value={<span className="text-[#ef4444]/80">auto</span>} state="error" />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="In the panel" note="paired rows">
        <Stage caption="A properties panel: paired fields, units only where the value has one, and no label above any row.">
          <PanelFrame title="Properties" width={240} className="mx-auto">
            <PanelSection title="Frame">
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="X" value="120" icon={<Move size={11} />} />
                <Field label="Y" value="80" />
                <Field label="W" value="420" unit="px" />
                <Field label="H" value="280" unit="px" />
              </div>
            </PanelSection>
            <PanelSection title="Appearance">
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="R" value="12" unit="px" icon={<RotateCw size={11} />} />
                <Field label="O" value="100" unit="%" />
              </div>
              <div className="pt-1.5">
                <Field label="Blend" value="Normal" icon={<Blend size={11} />} />
              </div>
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one field">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '28 / 32 / 40px', note: 'panel / dialog / marketing' },
            { name: 'radius', value: '6px', note: 'all sizes' },
            { name: 'padding', value: '6px', note: '10px at 40' },
            { name: 'surface', value: '#2b2b2b', note: 'hover #313131' },
            { name: 'text', value: '13px / 500', note: 'tabular-nums, right-aligned' },
            { name: 'unit', value: '11px', note: 'never editable' },
            { name: 'gap', value: '6px', note: 'glyph · value · unit' },
            { name: 'focus', value: '2px #52525b', note: 'never pink' },
            { name: 'error', value: '1px #ef4444', note: 'no helper text inside' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Fields never carry a pink border. Pink belongs to selection and the one primary action; a
            focused field is a neutral #52525b ring, an invalid one is red.
          </Note>
        </div>
      </Section>

      <Usage
        when="The frame around any value the user reads or changes in the properties panel or a form. It is the box, not the control: an input, a select, a number field and a date trigger all borrow it."
        rules={[
          'A field is 28px in the panel, 32px in a dialog, 40px on marketing pages. One surface uses one of those.',
          'The label is a glyph or one to three characters inside the box, beside the value it names. No label above the row.',
          'The value is right-aligned and tabular. Units are 11px and sit outside the editable text.',
          'Focus is a 2px neutral ring, #52525b. Fields never carry pink borders.',
          'An error is one red border and nothing else; the message belongs to the form, not the field.',
          'An empty field shows an em dash in quiet text, never a zero.',
        ]}
        checks={[
          'The visible value and the accessible name agree; a glyph alone is not a name.',
          'The focus ring meets 3:1 against #2b2b2b and against the black page.',
          'Disabled fields leave the tab order and read as unavailable.',
          'Units are read with the value, not announced as a separate control.',
        ]}
        edges={[
          'A mixed selection shows a dash; the first keystroke applies to every selected shape.',
          'A value wider than the box truncates; the tooltip carries the full number.',
          'A 240px panel fits two 28px fields per row with a 6px gap. A third goes to the next row.',
          'A disabled field that locks a property explains why in its tooltip.',
          'Browser zoom must not change the row height; sizes are px, not em.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Input ---------------------------------- */

type TextSize = 'sm' | 'md' | 'lg'
type TextState = 'rest' | 'hover' | 'focus' | 'invalid' | 'disabled'

const TEXT_SIZE: Record<TextSize, string> = {
  sm: 'h-7 px-2 text-[12.5px]',
  md: 'h-8 px-2.5 text-[13px]',
  lg: 'h-10 px-3 text-[14px]',
}

function TextInput({
  size = 'md',
  state = 'rest',
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  leading,
  trailing,
  className,
}: {
  size?: TextSize
  state?: TextState
  value?: string
  defaultValue?: string
  onChange?: (v: string) => void
  placeholder?: string
  label: string
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center gap-1.5 rounded-md border border-transparent bg-[#2b2b2b] text-foreground transition-colors',
        TEXT_SIZE[size],
        state === 'hover' && 'bg-[#313131]',
        state === 'focus' && 'ring-2 ring-[#52525b]/70',
        state === 'invalid' && 'border-[#ef4444]/70',
        state === 'disabled' && 'opacity-45',
        className,
      )}
    >
      {leading && <span className="flex shrink-0 items-center text-muted-foreground/70">{leading}</span>}
      <input
        aria-label={label}
        aria-invalid={state === 'invalid' || undefined}
        disabled={state === 'disabled'}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/45 disabled:cursor-not-allowed"
      />
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
    </div>
  )
}

function InputPage() {
  const [name, setName] = useState('hero-frame')
  return (
    <Page
      title="Input"
      lead="One line of typed text. The field draws the box; the input holds the caret."
      meta="3 sizes · 5 states"
    >
      <Section title="Sizes" note="height">
        <Tiles
          min={240}
          items={[
            {
              label: 'sm',
              note: '28px',
              node: (
                <div className="w-full max-w-[200px]">
                  <TextInput size="sm" label="Layer name" defaultValue="hero-frame" />
                </div>
              ),
            },
            {
              label: 'default',
              note: '32px',
              node: (
                <div className="w-full max-w-[200px]">
                  <TextInput label="Board name" defaultValue="Petals launch" />
                </div>
              ),
            },
            {
              label: 'lg',
              note: '40px',
              node: (
                <div className="w-full max-w-[200px]">
                  <TextInput size="lg" label="Email" placeholder="you@studio.com" />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="rest → focus → filled → disabled → invalid">
        <Tiles
          min={224}
          items={[
            {
              label: 'rest',
              node: (
                <div className="w-full max-w-[178px]">
                  <TextInput label="Search layers" placeholder="Search layers" leading={<Search size={12} />} />
                </div>
              ),
            },
            {
              label: 'focus',
              node: (
                <div className="w-full max-w-[178px]">
                  <TextInput label="Layer name" state="focus" defaultValue="hero-frame" />
                </div>
              ),
            },
            {
              label: 'filled',
              note: 'with clear',
              node: (
                <div className="w-full max-w-[178px]">
                  <TextInput
                    label="Frame name"
                    value={name}
                    onChange={setName}
                    trailing={
                      <button
                        type="button"
                        aria-label="Clear name"
                        onClick={() => setName('')}
                        className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground/60 hover:bg-white/5 hover:text-foreground"
                      >
                        <X size={11} />
                      </button>
                    }
                  />
                </div>
              ),
            },
            {
              label: 'disabled',
              node: (
                <div className="w-full max-w-[178px]">
                  <TextInput label="Frame name" state="disabled" defaultValue="hero-frame" />
                </div>
              ),
            },
            {
              label: 'invalid',
              note: 'hex',
              node: (
                <div className="w-full max-w-[178px]">
                  <TextInput label="Fill hex" state="invalid" defaultValue="pink-ish" />
                </div>
              ),
            },
            {
              label: 'typing',
              note: 'controlled',
              wide: true,
              node: (
                <div className="flex w-full max-w-[320px] flex-col gap-2">
                  <TextInput
                    label="Frame name"
                    value={name}
                    onChange={setName}
                    placeholder="hero-frame"
                    leading={<Search size={12} />}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    value: {name === '' ? '—' : name}
                  </span>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one input">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '28 / 32 / 40px', note: 'sm / default / lg' },
            { name: 'radius', value: '6px', note: 'matches fields' },
            { name: 'padding', value: '8 / 10 / 12px', note: 'horizontal' },
            { name: 'surface', value: '#2b2b2b', note: 'hover #313131' },
            { name: 'text', value: '12.5 / 13 / 14px', note: 'left-aligned' },
            { name: 'placeholder', value: 'muted 45%', note: 'an example, not a label' },
            { name: 'clear', value: '20px', note: 'trailing, only when filled' },
            { name: 'focus', value: '2px #52525b', note: 'never pink' },
            { name: 'invalid', value: '1px #ef4444', note: 'with aria-invalid' },
          ]}
        />
      </Section>

      <Usage
        when="A single line of user text: a name, a URL, a search query, a hex. Not for numbers (number input) or long copy (textarea)."
        rules={[
          'A placeholder is an example of a value, never the field’s name. “hero-frame”, not “Frame name”.',
          'No label inside the box once typing starts; the label lives in the panel row or above the form field.',
          'One line only. Long text scrolls horizontally under the caret and never wraps the box.',
          'The clear affordance appears only when there is text and sits at the trailing edge.',
          'Invalid is a red border plus aria-invalid; the message is not drawn inside the field.',
          'Autofill and paste keep the field’s background and text colour; a yellow autofill wash is a bug.',
        ]}
        checks={[
          'The input has a label or aria-label; a placeholder is not an accessible name.',
          'The caret and value meet contrast on #2b2b2b; placeholder text is quieter but still readable.',
          'Escape clears a search field only when the surface agrees; it never drops an edited value silently.',
          'Enter submits only when the form has a submit action.',
        ]}
        edges={[
          'IME composition: the value commits on compositionend, not on every keystroke.',
          'A 200-character paste in a single-line input stays one line and scrolls to the caret.',
          'Clearing with the X returns focus to the input rather than the next control.',
          'A disabled input still shows its value; it does not turn into a placeholder.',
          'The trailing button stays 20px so the text area never drops below 60px in a 240px panel.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Textarea -------------------------------- */

type AreaState = 'rest' | 'focus' | 'invalid' | 'disabled'

function Grip() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-1 right-1.5 flex w-2.5 flex-col items-end gap-[2px]"
    >
      <span className="block h-px w-2 bg-white/20" />
      <span className="block h-px w-1.5 bg-white/20" />
      <span className="block h-px w-1 bg-white/20" />
    </span>
  )
}

function Area({
  rows = 3,
  state = 'rest',
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  limit,
  className,
}: {
  rows?: number
  state?: AreaState
  value?: string
  defaultValue?: string
  onChange?: (v: string) => void
  placeholder?: string
  label: string
  limit?: number
  className?: string
}) {
  const [len, setLen] = useState((value ?? defaultValue ?? '').length)
  return (
    <div className={cn('relative w-full', className)}>
      <textarea
        aria-label={label}
        aria-invalid={state === 'invalid' || undefined}
        disabled={state === 'disabled'}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setLen(e.target.value.length)
          onChange?.(e.target.value)
        }}
        placeholder={placeholder}
        className={cn(
          'w-full resize-none rounded-md border border-transparent bg-[#2b2b2b] px-2.5 py-2 text-[13px] leading-[18px] text-foreground outline-none placeholder:text-muted-foreground/45 focus-visible:ring-2 focus-visible:ring-[#52525b]/70',
          limit !== undefined && 'pb-6',
          state === 'focus' && 'ring-2 ring-[#52525b]/70',
          state === 'invalid' && 'border-[#ef4444]/70',
          state === 'disabled' && 'opacity-45',
        )}
      />
      {limit !== undefined && (
        <span
          className={cn(
            'pointer-events-none absolute bottom-1.5 right-5 font-mono text-[10px]',
            state === 'invalid' ? 'text-[#ef4444]/80' : 'text-muted-foreground/55',
          )}
        >
          {len} / {limit}
        </span>
      )}
      <Grip />
    </div>
  )
}

const LONG_COPY =
  'A soft pink wash sits behind the hero and fades out by 60 percent, so the headline keeps its contrast on every board.'

function GrowingArea() {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const [text, setText] = useState('A soft pink wash sits behind the hero and fades out by 60%.')
  const MAX = 168

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(el.scrollHeight, MAX)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX ? 'auto' : 'hidden'
  }, [text])

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-2">
      <div className="relative">
        <textarea
          ref={ref}
          aria-label="Frame description"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ minHeight: 72, maxHeight: MAX }}
          className="w-full resize-none rounded-md border border-transparent bg-[#2b2b2b] px-2.5 py-2 pr-2 pb-6 text-[13px] leading-[18px] text-foreground outline-none placeholder:text-muted-foreground/45 focus-visible:ring-2 focus-visible:ring-[#52525b]/70"
        />
        <span className="pointer-events-none absolute bottom-1.5 right-5 font-mono text-[10px] text-muted-foreground/55">
          {text.length} / 200
        </span>
        <Grip />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground/50">
        grows with content, stops at 168px
      </span>
    </div>
  )
}

function TextareaPage() {
  const [draft, setDraft] = useState(LONG_COPY.slice(0, 118))
  return (
    <Page
      title="Textarea"
      lead="Multi-line text that grows to a limit, then scrolls inside its own box."
      spec
      meta="72–168px · 4 states · count at the trailing corner"
    >
      <Section title="Sizes" note="min-height">
        <Tiles
          min={252}
          items={[
            {
              label: '3 rows',
              note: '72px',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Note" rows={3} placeholder="Add a note for the next session" />
                </div>
              ),
            },
            {
              label: '4 rows',
              note: '90px',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Alt text" rows={4} defaultValue="Pink gradient field behind the hero." />
                </div>
              ),
            },
            {
              label: '6 rows',
              note: '126px',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Description" rows={6} defaultValue={LONG_COPY} />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Growth" note="auto-grow, max 168px">
        <Stage caption="The box grows with the copy and stops at 168px. The count and the grip hold the bottom-right corner; the text never runs under them.">
          <div className="flex flex-wrap items-start gap-6">
            <GrowingArea />
            <div className="min-w-[170px] flex-1">
              <Area
                label="Draft"
                rows={3}
                value={draft}
                onChange={setDraft}
                limit={200}
                className="max-w-[300px]"
              />
              <p className="mt-2 max-w-[300px] text-[11.5px] leading-relaxed text-muted-foreground/60">
                The count holds the bottom-right corner and never overlaps the last line.
              </p>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="States" note="rest → focus → disabled → over limit">
        <Tiles
          min={252}
          items={[
            {
              label: 'rest',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Note" rows={3} placeholder="Add a note for the next session" />
                </div>
              ),
            },
            {
              label: 'focus',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Note" rows={3} state="focus" defaultValue="Check the export bounds." />
                </div>
              ),
            },
            {
              label: 'disabled',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area label="Note" rows={3} state="disabled" defaultValue="Locked with the frame." />
                </div>
              ),
            },
            {
              label: 'over limit',
              note: 'invalid',
              node: (
                <div className="w-full max-w-[210px]">
                  <Area
                    label="Description"
                    rows={3}
                    state="invalid"
                    defaultValue={'Pink wash behind the hero, fading by 60 percent. '.repeat(5)}
                    limit={200}
                  />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one box">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'min-height', value: '72px', note: '3 rows' },
            { name: 'max-height', value: '168px', note: 'then scrolls' },
            { name: 'line-height', value: '18px', note: 'always 18' },
            { name: 'padding', value: '8px 10px', note: '24px bottom for the count' },
            { name: 'radius', value: '6px', note: 'matches fields' },
            { name: 'count', value: '10px mono', note: 'bottom-right, 6px inset' },
            { name: 'grip', value: '10px · 3 lines', note: 'drawn, not native' },
            { name: 'focus', value: '2px #52525b', note: 'never pink' },
            { name: 'limit', value: '200 chars', note: 'announced near the limit' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A textarea beats an inline canvas text edit when the copy is longer than one line or lives
            in a dialog. Inline editing is for the short strings already on the board.
          </Note>
        </div>
      </Section>

      <Usage
        when="Long copy that needs line breaks: descriptions, alt text, notes on a shared board, an export caption. Anything that would scroll sideways in a single-line input."
        rules={[
          'Start at 3 rows (72px), grow with content to 168px, then scroll inside the box.',
          'The character count sits inside the bottom-right corner in 10px mono and never overlaps the last line.',
          'The resize grip is drawn, not native, so it reads the same on every OS. It sets height, never width.',
          'No helper paragraph under the box. The count is the only live message.',
          'Enter inserts a line break. In a dialog, ⌘Enter is the submit.',
          'Paste keeps line breaks and strips trailing whitespace.',
          'A textarea beats an inline canvas text edit when the copy is long or belongs to a form.',
        ]}
        checks={[
          'The box has a label; the character count is not its accessible name.',
          'The count is announced politely and only near the limit, not on every keystroke.',
          'The grip stays visible and the box stays usable at 200% zoom.',
          'Focus ring is visible on #2b2b2b; a disabled box leaves the tab order.',
        ]}
        edges={[
          'A 400-character paste stops at the limit and says how many characters were dropped.',
          'An empty box shows a placeholder example, never an instruction sentence.',
          'A manually dragged height becomes the new max for the session; auto-grow does not fight it.',
          'In a 240px panel, 10px padding and the count stay clear of the last line.',
          'Undo inside the box restores text; undo outside it restores the whole transaction.',
          'A line longer than the box wraps at the panel edge without a horizontal scrollbar.',
        ]}
        keys={[
          'Enter — insert a line break',
          'Tab — leave the box and commit',
          'Escape — revert to the value at focus',
          '⌘Enter — submit from a dialog',
        ]}
      />
    </Page>
  )
}

/* ----------------------------------- Chip ---------------------------------- */

type ChipSize = 'sm' | 'md' | 'lg'

const CHIP_SIZE: Record<ChipSize, string> = {
  sm: 'h-5 px-2 text-[10.5px]',
  md: 'h-[22px] px-2.5 text-[11px]',
  lg: 'h-[26px] px-3 text-[11.5px]',
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  onRemove,
  leading,
  size = 'md',
  mono,
}: {
  label: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  onRemove?: () => void
  leading?: ReactNode
  size?: ChipSize
  mono?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent font-medium transition-colors',
        CHIP_SIZE[size],
        selected ? 'bg-[#f472b6] text-[#2b0a1c]' : 'bg-[#262626] text-foreground/70',
        !selected && !disabled && 'hover:bg-[#2f2f2f]',
        disabled && 'opacity-40',
        mono && 'font-mono',
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={onClick}
        className={cn(
          'flex min-w-0 cursor-pointer items-center gap-1 disabled:cursor-not-allowed',
          onRemove ? 'pr-0' : '',
        )}
      >
        {leading && <span className="flex shrink-0 items-center">{leading}</span>}
        <span className="truncate">{label}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          disabled={disabled}
          onClick={onRemove}
          className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-black/15 disabled:cursor-not-allowed"
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

function ChipPage() {
  const [filters, setFilters] = useState<string[]>(['text'])
  const [stops, setStops] = useState<string[]>(['#F472B6', '#C084FC', '#FFFFFF'])
  const toggle = (f: string) =>
    setFilters((v) => (v.includes(f) ? v.filter((x) => x !== f) : [...v, f]))
  const gradient = `linear-gradient(90deg, ${stops.join(', ')})`
  return (
    <Page
      title="Chip"
      lead="A short token you can select or remove: a filter, a gradient stop."
      meta="3 sizes · 2 uses"
    >
      <Section title="Filter chips" note="above the canvas">
        <Stage caption="Filters sit over the board while they are active. Selected is pink; the row scrolls sideways before it wraps.">
          <div className="rounded-lg bg-[#141418] p-4 ring-1 ring-white/5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <Chip label="All" selected={filters.length === 0} onClick={() => setFilters([])} />
              {['frames', 'text', 'images', 'components'].map((f) => (
                <Chip
                  key={f}
                  label={f[0].toUpperCase() + f.slice(1)}
                  selected={filters.includes(f)}
                  onClick={() => toggle(f)}
                />
              ))}
            </div>
            <div className="mt-4 flex h-24 items-center justify-center rounded border border-dashed border-white/10 font-mono text-[10px] text-muted-foreground/50">
              {filters.length === 0 ? '24 layers' : `${filters.length * 2} matching layers`}
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Gradient stops" note="fill panel">
        <Stage caption="A stop chip carries the colour and its hex. Two stops are the floor, so the last two have no remove button.">
          <div className="w-full max-w-[360px]">
            <div className="relative mx-2 h-3.5 rounded-md ring-1 ring-inset ring-black/20" style={{ background: gradient }}>
              {stops.map((s, i) => (
                <span
                  key={`${s}${i}`}
                  className={cn(
                    'absolute top-1/2 h-3.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[4px] border-2 shadow-sm',
                    i === 0 ? 'border-white' : 'border-white/60',
                  )}
                  style={{ left: `${(i / (stops.length - 1)) * 100}%`, background: s }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {stops.map((s, i) => (
                <Chip
                  key={`${s}${i}`}
                  label={s}
                  mono
                  size="sm"
                  leading={<span className="size-2 rounded-full ring-1 ring-inset ring-black/20" style={{ background: s }} />}
                  onRemove={
                    stops.length > 2
                      ? () => setStops((v) => v.filter((_, j) => j !== i))
                      : undefined
                  }
                />
              ))}
              {stops.length < 5 && (
                <button
                  type="button"
                  onClick={() => setStops((v) => [...v, '#808080'])}
                  className="inline-flex h-5 cursor-pointer items-center gap-1 rounded-full border border-dashed border-white/15 px-2 text-[10.5px] text-muted-foreground/70 hover:border-white/25 hover:text-foreground"
                >
                  <Plus size={10} />
                  Add stop
                </button>
              )}
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Sizes" note="height">
        <Tiles
          items={[
            { label: 'sm', note: '20px', node: <Chip label="Text" size="sm" selected /> },
            { label: 'default', note: '22px', node: <Chip label="Text" selected /> },
            { label: 'lg', note: '26px', node: <Chip label="Text" selected /> },
            { label: 'disabled', note: '22px', node: <Chip label="Images" disabled /> },
          ]}
        />
        <div className="mt-4">
          <Note>
            Chip, badge, button: a chip carries a value or a filter and can be selected or removed; a
            badge reports a fact and does nothing; a button performs an action and its label is a verb.
          </Note>
        </div>
      </Section>

      <Usage
        when="A filter that is on, or a value that can be removed. Two places in petals: filter chips above the canvas and gradient stop chips in the fill panel. A chip is never a page action."
        rules={[
          'A chip is a token, not a button: its label is a noun or a value, never a verb.',
          'Filter chips are multi-select. Selected is pink fill with near-black text; unselected is #262626.',
          'A removable chip puts the x at the trailing edge with an 8px gap and an aria-label that names the chip.',
          'A gradient keeps at least two stops. The remove affordance is absent on those, not disabled.',
          'Never put a chip where a button belongs. Chips report state, they do not start work.',
          'One row of chips. Overflow scrolls horizontally above the canvas rather than wrapping into the artboard.',
        ]}
        checks={[
          'A filter chip exposes aria-pressed; its remove button has its own name.',
          'Selected state is not colour alone — aria-pressed carries it too.',
          'The x target is at least 16px even when the chip is 20px tall.',
          'Disabled chips are skipped by Tab and stay legible at 40% opacity.',
        ]}
        edges={[
          'A filter with zero matches stays selected and shows the empty result; it never clears itself.',
          'A long filter name truncates at 160px with the x still visible.',
          'Removing the last filter returns the board to All rather than an empty filter row.',
          'Gradient stop colours update live while the swatch popover is open; the chip label follows.',
          'Pasting a hex into a stop chip keeps the chip width; only the label changes.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Date picker ------------------------------ */

type DayCell = { day: number; out: boolean }
type DayRange = { start: number; end: number | null }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function monthCells(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells: DayCell[] = []
  for (let i = offset; i > 0; i--) cells.push({ day: prevDays - i + 1, out: true })
  for (let d = 1; d <= days; d++) cells.push({ day: d, out: false })
  let next = 1
  while (cells.length < 35 || cells.length % 7 !== 0) cells.push({ day: next++, out: true })
  return cells
}

function DateTrigger({
  value,
  state = 'rest',
  size = 'field',
}: {
  value?: string
  state?: 'rest' | 'focus' | 'open' | 'disabled' | 'error'
  size?: 'field' | 'form'
}) {
  return (
    <span
      className={cn(
        'flex w-[164px] items-center gap-2 rounded-md border border-transparent bg-[#2b2b2b] px-2 text-[12.5px] transition-colors',
        size === 'field' ? 'h-7' : 'h-8',
        state === 'focus' && 'ring-2 ring-[#52525b]/70',
        state === 'open' && 'bg-[#25252b] ring-1 ring-white/10',
        state === 'error' && 'border-[#ef4444]/70',
        state === 'disabled' && 'opacity-45',
      )}
    >
      <CalendarDays size={12} className="shrink-0 text-muted-foreground/70" />
      <span className={cn('min-w-0 flex-1 truncate', value ? 'text-foreground/90' : 'text-muted-foreground/45')}>
        {value ?? 'Pick a date'}
      </span>
      <ChevronDown size={12} className="shrink-0 text-muted-foreground/70" />
    </span>
  )
}

function Calendar({
  cells,
  month,
  range,
  today,
  onPick,
  onShiftMonth,
  summary,
}: {
  cells: DayCell[]
  month: number
  range: DayRange
  today?: number
  onPick: (day: number) => void
  onShiftMonth: (delta: number) => void
  summary: string
}) {
  return (
    <div className="w-[236px] rounded-lg border border-border bg-[#1a1a20] p-2">
      <div className="flex h-8 items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={month === 0}
          onClick={() => onShiftMonth(-1)}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="flex items-center gap-1 text-[12.5px] font-semibold text-foreground/90">
          {MONTHS[month]} 2026
          <ChevronDown size={11} className="text-muted-foreground/70" />
        </span>
        <button
          type="button"
          aria-label="Next month"
          disabled={month === 11}
          onClick={() => onShiftMonth(1)}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="grid grid-cols-7 pb-1 font-mono text-[9.5px] text-muted-foreground/50">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`${d}${i}`} className="flex h-6 items-center justify-center">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((c, i) => {
          const isStart = !c.out && c.day === range.start
          const isEnd = !c.out && range.end !== null && c.day === range.end
          const inRange =
            !c.out && range.end !== null && c.day > range.start && c.day < range.end
          const isToday = !c.out && today === c.day
          return (
            <div key={i} className={cn('flex h-7 items-center justify-center', inRange && 'bg-[#f472b6]/15')}>
              <button
                type="button"
                disabled={c.out}
                aria-label={`${c.day} ${MONTHS[month]} 2026`}
                aria-pressed={isStart || isEnd}
                onClick={() => onPick(c.day)}
                className={cn(
                  'flex size-7 items-center justify-center rounded-md text-[11.5px] tabular-nums transition-colors',
                  c.out && 'cursor-default text-muted-foreground/25',
                  !c.out && !isStart && !isEnd && 'text-foreground/80 hover:bg-white/5',
                  (isStart || isEnd) && 'bg-[#f472b6] font-medium text-[#2b0a1c]',
                  isToday && 'ring-1 ring-inset ring-white/40',
                )}
              >
                {c.day}
              </button>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-border/70 pt-1.5">
        <span className="truncate text-[10.5px] text-muted-foreground/60">{summary}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Kbd>Esc</Kbd>
          <Kbd>↵</Kbd>
        </span>
      </div>
    </div>
  )
}

function DatePickerPage() {
  const [month, setMonth] = useState(9)
  const [range, setRange] = useState<DayRange>({ start: 12, end: 18 })
  const cells = monthCells(2026, month)
  const pick = (day: number) =>
    setRange((r) => {
      if (r.end !== null || r.start === 0 || day < r.start) return { start: day, end: null }
      return { start: r.start, end: day }
    })
  const shiftMonth = (delta: number) => {
    setMonth((m) => Math.min(11, Math.max(0, m + delta)))
    setRange({ start: 0, end: null })
  }
  const short = MONTHS[month].slice(0, 3)
  const label =
    range.start === 0
      ? undefined
      : range.end !== null
        ? `${range.start}–${range.end} ${short}`
        : `${range.start} ${short}`
  return (
    <Page
      title="Date picker"
      lead="A field-shaped trigger and a month grid. Dates only, no time of day."
      spec
      meta="236px calendar · 28px cells · Monday first"
    >
      <Section title="Trigger" note="looks like a field">
        <Tiles
          min={208}
          items={[
            { label: 'rest', note: 'no date', node: <DateTrigger /> },
            { label: 'filled', note: 'range', node: <DateTrigger value={label ?? '12–18 Oct'} /> },
            { label: 'focus', node: <DateTrigger value={label ?? '12–18 Oct'} state="focus" /> },
            { label: 'open', node: <DateTrigger value={label ?? '12–18 Oct'} state="open" /> },
            { label: 'disabled', node: <DateTrigger value="12 Oct" state="disabled" /> },
          ]}
        />
      </Section>

      <Section title="Calendar" note="range selection">
        <Stage caption="The calendar overlays the canvas. Cells touch so a range reads as one band; the endpoints keep the pink and the tint stops at their edges.">
          <div className="flex flex-col items-start gap-2">
            <DateTrigger value={label} state="open" />
            <Calendar
              cells={cells}
              month={month}
              range={range}
              today={month === 9 ? 21 : undefined}
              onPick={pick}
              onShiftMonth={shiftMonth}
              summary={
                range.start === 0
                  ? 'No date selected'
                  : range.end !== null
                    ? `${range.start}–${range.end} ${short}`
                    : `From ${range.start} ${short}`
              }
            />
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="trigger and grid">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'trigger', value: '28 / 32px', note: 'panel / dialog' },
            { name: 'calendar', value: '236px', note: '8px padding' },
            { name: 'cell', value: '28 × 28px', note: '7 columns, no gap' },
            { name: 'week start', value: 'Monday', note: 'M T W T F S S' },
            { name: 'selected', value: '#f472b6 · #2b0a1c', note: 'both endpoints' },
            { name: 'range', value: '#f472b6 15%', note: 'tint between endpoints' },
            { name: 'today', value: '1px white/40 ring', note: 'never pink' },
            { name: 'header', value: '32px · 12.5/600', note: 'month and year in one control' },
            { name: 'popover', value: '6px below trigger', note: 'flips above near the edge' },
          ]}
        />
      </Section>

      <Usage
        when="A date on a board or in an export dialog: a due date, a version date, a scheduled publish. Not a time — petals stores dates, not appointments."
        rules={[
          'The trigger looks exactly like a field: 28px in a panel, 32px in a dialog, calendar glyph leading, chevron trailing.',
          'The popover opens 6px below the trigger, or above it near the window edge. It overlays the canvas and never reflows the panel.',
          'Weeks start on Monday. Seven columns, 28px cells, no gap between day cells so a range reads as one band.',
          'Selected endpoints are pink with near-black text; in-range days carry a 15% pink tint; today is a 1px neutral ring.',
          'Month and year are one control. Changing them keeps the day when it exists, otherwise the last valid day.',
          'No time picker. If a time is needed it is a separate select, not a second column.',
        ]}
        checks={[
          'The trigger exposes the formatted date as its accessible name, not “calendar”.',
          'The grid is one tab stop; arrows move by day and week, PageUp/PageDown by month.',
          'The focused day is announced with its full date and selected state.',
          'Range endpoints and in-range days are distinguishable without colour, by weight and tint.',
          'Today’s ring is not the only cue; its label reads “Today, 21 October”.',
        ]}
        edges={[
          'The 31st is selected, then the month changes to February: the day clamps to the 28th or 29th.',
          'A range whose end precedes its start swaps endpoints on commit rather than rejecting the click.',
          'Near the bottom edge the popover flips above the trigger and keeps the selected week visible.',
          'A trailing day from the next month still commits when picked.',
          'Undo after picking a date restores the previous date in one step.',
          'In a 240px panel the 236px popover keeps an 8px margin from the viewport edge.',
        ]}
        keys={[
          '←/→ — previous or next day',
          '↑/↓ — previous or next week',
          'PageUp/PageDown — previous or next month',
          'Home/End — first or last day of the week',
          'Enter — pick the focused day',
          'Escape — close and return focus to the trigger',
        ]}
      />
    </Page>
  )
}

/* ------------------------------- Number input ------------------------------ */

type NumSize = 'field' | 'compact'
type NumView = 'rest' | 'hover' | 'scrubbing' | 'editing' | 'disabled'

const NUM_SIZE: Record<NumSize, string> = {
  field: 'h-7 px-1.5 text-[13px]',
  compact: 'h-[26px] px-1.5 text-[12px]',
}

const NUM_BASE = 'flex min-w-0 flex-1 items-center gap-1 rounded-md border'

function fmt(n: number) {
  return String(Math.round(n * 100) / 100)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function NumStatic({
  label = 'W',
  value = 420,
  unit,
  size = 'field',
  view = 'rest',
}: {
  label?: string
  value?: number
  unit?: string
  size?: NumSize
  view?: NumView
}) {
  return (
    <span
      className={cn(
        NUM_BASE,
        NUM_SIZE[size],
        'w-[144px] border-transparent bg-[#2b2b2b] transition-colors',
        (view === 'hover' || view === 'scrubbing') && 'border-border bg-[#313131]',
        view === 'editing' && 'border-[#52525b]',
        view === 'disabled' && 'opacity-45',
      )}
    >
      <span
        className={cn(
          'flex w-4 shrink-0 select-none items-center justify-center text-[11px]',
          view === 'scrubbing' ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      {view === 'editing' ? (
        <span className="min-w-0 flex-1 truncate rounded-[2px] bg-[#f472b6]/30 text-right font-medium tabular-nums text-foreground">
          {fmt(value)}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-right font-medium tabular-nums">{fmt(value)}</span>
      )}
      {unit && <span className="shrink-0 text-[11px] text-muted-foreground">{unit}</span>}
    </span>
  )
}

function NumDemo({
  label = 'W',
  initial = 0,
  unit,
  min = -9999,
  max = 9999,
  step = 1,
  size = 'field',
  disabled,
}: {
  label?: string
  initial?: number
  unit?: string
  min?: number
  max?: number
  step?: number
  size?: NumSize
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dragged = useRef(false)
  const cancelled = useRef(false)
  const before = useRef(initial)

  const startScrub = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (disabled || e.button !== 0) return
    e.preventDefault()
    const startX = e.clientX
    const startValue = value
    let moved = false
    dragged.current = false
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - startX) <= 2) return
      moved = true
      dragged.current = true
      setScrubbing(true)
      setValue(clamp(startValue + (ev.clientX - startX) * step, min, max))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setScrubbing(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const display = editing ?? fmt(value)

  return (
    <div
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        inputRef.current?.focus()
      }}
      className={cn(
        NUM_BASE,
        NUM_SIZE[size],
        'border-transparent bg-[#2b2b2b] transition-colors focus-within:border-[#52525b]',
        !disabled && 'hover:bg-[#313131]',
        scrubbing && 'bg-[#313131]',
        disabled && 'opacity-45',
      )}
    >
      <span
        onPointerDown={startScrub}
        className={cn(
          'flex w-4 shrink-0 select-none items-center justify-center text-[11px]',
          disabled ? 'text-muted-foreground/70' : 'cursor-ew-resize',
          scrubbing ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        aria-label={label}
        disabled={disabled}
        value={display}
        onFocus={(e) => {
          const el = e.currentTarget
          before.current = value
          setEditing(fmt(value))
          requestAnimationFrame(() => {
            try {
              el.select()
            } catch {
              /* detached by then */
            }
          })
        }}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => {
          if (cancelled.current) {
            cancelled.current = false
            setEditing(null)
            return
          }
          if (editing === null) return
          const n = parseFloat(editing)
          if (Number.isFinite(n)) setValue(clamp(n, min, max))
          setEditing(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
            return
          }
          if (e.key === 'Escape') {
            cancelled.current = true
            setValue(before.current)
            e.currentTarget.blur()
            return
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const base = parseFloat(editing ?? fmt(value))
            const from = Number.isFinite(base) ? base : value
            const delta = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? step * 10 : step)
            const next = clamp(from + delta, min, max)
            setValue(next)
            setEditing(fmt(next))
          }
        }}
        className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-right font-medium tabular-nums text-foreground outline-none disabled:cursor-not-allowed"
      />
      {unit && <span className="shrink-0 text-[11px] text-muted-foreground">{unit}</span>}
    </div>
  )
}

function NumberInputPage() {
  return (
    <Page
      title="Number input"
      lead="Type, step, or scrub a number. The glyph is the handle; the value selects itself."
      meta="2 sizes · 5 states · 1 unit per px"
    >
      <Section title="In the panel" note="scrub or type">
        <Stage caption="A selection’s frame: X and Y can go negative, size and radius clamp at zero. Drag any glyph horizontally, or click a value and type.">
          <PanelFrame title="Properties" width={240} className="mx-auto">
            <PanelSection title="Frame">
              <div className="grid grid-cols-2 gap-1.5">
                <NumDemo label="X" initial={120} />
                <NumDemo label="Y" initial={80} />
                <NumDemo label="W" initial={420} unit="px" min={0} />
                <NumDemo label="H" initial={280} unit="px" min={0} />
              </div>
            </PanelSection>
            <PanelSection title="Appearance">
              <div className="grid grid-cols-2 gap-1.5">
                <NumDemo label="R" initial={12} unit="px" min={0} max={999} />
                <NumDemo label="O" initial={100} unit="%" min={0} max={100} />
              </div>
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="States" note="rest → hover → scrubbing → editing → disabled">
        <Tiles
          min={190}
          items={[
            { label: 'rest', node: <NumStatic label="W" value={420} unit="px" /> },
            { label: 'hover', node: <NumStatic label="W" value={420} unit="px" view="hover" /> },
            { label: 'scrubbing', note: 'drag', node: <NumStatic label="W" value={437} unit="px" view="scrubbing" /> },
            { label: 'editing', note: 'all selected', node: <NumStatic label="W" value={420} unit="px" view="editing" /> },
            { label: 'disabled', node: <NumStatic label="W" value={420} unit="px" view="disabled" /> },
          ]}
        />
      </Section>

      <Section title="Sizes" note="height">
        <Tiles
          items={[
            { label: 'field', note: '28px', node: <NumDemo label="W" initial={420} unit="px" min={0} /> },
            { label: 'compact', note: '26px', node: <NumDemo label="R" initial={12} unit="px" min={0} size="compact" /> },
            { label: 'no unit', note: '28px', node: <NumDemo label="X" initial={120} /> },
            { label: 'percent', note: '26px', node: <NumDemo label="O" initial={100} unit="%" min={0} max={100} size="compact" /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one number field">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '28 / 26px', note: 'field / compact' },
            { name: 'radius', value: '6px', note: 'all' },
            { name: 'padding', value: '6px', note: 'horizontal' },
            { name: 'glyph', value: '16px · 11px label', note: 'the scrub handle' },
            { name: 'value', value: '13px / 500', note: 'tabular-nums, right' },
            { name: 'unit', value: '11px', note: 'never editable' },
            { name: 'step', value: '1 · Shift 10', note: 'arrows and scrub' },
            { name: 'scrub', value: '1 unit per px', note: 'no modifier' },
            { name: 'clamp', value: 'during scrub', note: 'min / max' },
            { name: 'focus', value: '1px #52525b', note: 'border, not ring' },
          ]}
        />
      </Section>

      <Usage
        when="Every numeric property in the right panel: position, size, rotation, radius, opacity, letter spacing. Drag when the value is approximate, type when it must be exact."
        rules={[
          'The glyph is the scrub handle: pointer down and move horizontally, 1 unit per pixel, Shift for 10.',
          'Click the number to edit; the whole value selects on focus, so typing replaces it.',
          'ArrowUp and ArrowDown step by 1, Shift by 10. The arrows never move the canvas selection.',
          'Enter commits, Escape reverts, blur commits the last valid number. Empty or invalid input reverts, never to 0.',
          'The value clamps at min and max during the scrub, not only on release.',
          'Units sit after the number and are never typed. A percent field shows 100, not 1.',
          'A mixed selection shows a dash; the first scrub or keystroke applies to every selected shape in one transaction.',
        ]}
        checks={[
          'The input carries the accessible name (X position); the glyph is decorative.',
          'Scrubbing is pointer-only; every value is also reachable by typing and arrow keys.',
          'Focus is a 1px #52525b border, visible on #2b2b2b.',
          'The glyph has a 16px hit area and an ew-resize cursor; the whole box focuses the input.',
          'A gesture commits once; screen readers hear the result on commit, not on every pixel.',
        ]}
        edges={[
          'A drag that ends outside the window still commits and clears the scrubbing state.',
          'Typing “-” or “.” mid-entry does not commit until the text parses as a number.',
          'A field with max 0 disables instead of accepting a negative.',
          'At 240px, two fields share a row; a third wraps rather than scrolling sideways.',
          'A locked shape disables its fields but still shows their values.',
          'Pasting “12px” parses 12; pasting “auto” reverts to the previous value.',
        ]}
        keys={[
          '↑/↓ — step by 1, Shift by 10',
          'Enter — commit',
          'Escape — revert',
          'Tab — next field, value committed',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- OTP input ------------------------------- */

type OtpState = 'rest' | 'filled' | 'focus' | 'error' | 'disabled'

function OtpVisual({ value = '', state = 'rest' }: { value?: string; state?: OtpState }) {
  const chars = value.split('').slice(0, 6)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2" role="group" aria-label="Invite code">
        {Array.from({ length: 6 }, (_, i) => {
          const focused = state === 'focus' && i === Math.min(chars.length, 5)
          return (
            <span
              key={i}
              className={cn(
                'flex items-center justify-center rounded-md bg-[#2b2b2b] font-mono text-[15px] font-medium text-foreground',
                state === 'disabled' && 'opacity-45',
                state === 'error' && 'ring-1 ring-[#ef4444]/70',
                focused && 'ring-2 ring-[#52525b]/70',
              )}
              style={{ width: 36, height: 36 }}
            >
              {chars[i] ?? ''}
            </span>
          )
        })}
      </div>
      {state === 'error' && (
        <span className="text-[11px] leading-relaxed text-[#ef4444]/85">
          That code has expired. Send a new one.
        </span>
      )}
    </div>
  )
}

function OtpDemo() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null)
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const focusAt = (i: number) => {
    refs.current[Math.max(0, Math.min(5, i))]?.focus()
  }

  const setDigit = (i: number, v: string) =>
    setDigits((prev) => prev.map((d, j) => (j === i ? v : d)))

  const onPaste = (e: ReactClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setDigits(next)
    focusAt(Math.min(text.length, 5))
  }

  const complete = digits.every((d) => d !== '')
  const code = digits.join('')
  const verified = complete && verifiedCode === code

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2" role="group" aria-label="Invite code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={d}
            maxLength={1}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${i + 1} of 6`}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '')
              if (!raw) {
                setDigit(i, '')
                return
              }
              const chars = raw.slice(0, 6 - i).split('')
              setDigits((prev) => {
                const next = [...prev]
                chars.forEach((c, j) => {
                  next[i + j] = c
                })
                return next
              })
              focusAt(i + chars.length)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                if (d !== '') {
                  e.preventDefault()
                  setDigit(i, '')
                  return
                }
                e.preventDefault()
                if (i > 0) {
                  setDigit(i - 1, '')
                  focusAt(i - 1)
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                focusAt(i - 1)
              } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                focusAt(i + 1)
              }
            }}
            onPaste={onPaste}
            onFocus={(e) => e.currentTarget.select()}
            className="flex items-center justify-center rounded-md border border-transparent bg-[#2b2b2b] text-center font-mono text-[15px] font-medium text-foreground outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[#52525b]/70"
            style={{ width: 36, height: 36 }}
          />
        ))}
      </div>
      <Btn variant="primary" disabled={!complete} onClick={() => setVerifiedCode(code)}>
        Verify
      </Btn>
      {verified && (
        <span role="status" className="text-[11px] leading-relaxed text-[#4ade80]/85">
          Code accepted.
        </span>
      )}
      <span className="font-mono text-[10px] text-muted-foreground/50">
        {digits.filter((d) => d !== '').length} / 6 digits
      </span>
    </div>
  )
}

function OtpInputPage() {
  return (
    <Page
      title="OTP input"
      lead="Six slots for a short code. Typing walks forward; paste fills the row."
      spec
      meta="6 slots · 36px · no animation"
    >
      <Section title="Slots" note="type or paste">
        <Stage caption="One digit per slot. Focus moves forward on input and back on Backspace; a pasted code fills from the first slot. Verify stays disabled until all six are present.">
          <OtpDemo />
        </Stage>
      </Section>

      <Section title="States" note="rest → partial → focus → error → disabled">
        <Tiles
          min={300}
          items={[
            { label: 'rest', node: <OtpVisual /> },
            { label: 'partial', node: <OtpVisual value="418" /> },
            { label: 'focus', note: 'next slot', node: <OtpVisual value="418" state="focus" /> },
            { label: 'error', note: 'wrong code', node: <OtpVisual value="418207" state="error" /> },
            { label: 'disabled', node: <OtpVisual value="418207" state="disabled" /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="six slots">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'slot', value: '36 × 36px', note: 'fixed' },
            { name: 'gap', value: '8px', note: 'between slots' },
            { name: 'radius', value: '6px', note: 'matches fields' },
            { name: 'surface', value: '#2b2b2b', note: 'empty and filled alike' },
            { name: 'font', value: 'Geist Mono 15/500', note: 'centred digit' },
            { name: 'focus', value: '2px #52525b', note: 'neutral, never pink' },
            { name: 'error', value: '1px #ef4444', note: 'no shake' },
            { name: 'animation', value: 'none', note: '0ms on every state' },
            { name: 'submit', value: 'disabled until 6', note: 'never auto-submits' },
          ]}
        />
      </Section>

      <Usage
        when="A one-time code from outside the editor: an invite to a shared board, a sign-in confirmation. petals rarely needs it — there is no account wall inside the canvas — so it appears only on invite and auth screens."
        rules={[
          'Six slots, 36px square, 8px gaps, one digit each. A shorter code uses fewer slots, not smaller ones.',
          'Typing a digit fills the slot and moves focus forward; the last digit does not wrap.',
          'Backspace on an empty slot clears the previous digit and focuses it.',
          'Paste fills from the first slot with digits only; extra characters are dropped.',
          'Focus is a 2px neutral ring on the slot that will receive the next digit.',
          'An error is a red border and a plain sentence below. No shake, no animation.',
          'The submit button stays disabled until every slot is filled; it never auto-submits.',
        ]}
        checks={[
          'Each slot is named (“Digit 3 of 6”) and the group is labelled “Invite code”.',
          'The completed code is read once, not digit by digit as focus moves.',
          'Numeric input opens the digit keyboard on touch; pasting is supported.',
          'The error is announced politely and focus returns to the first empty slot.',
        ]}
        edges={[
          'A pasted code with spaces or dashes keeps only the digits.',
          'A code longer than six digits is cut at six and the extra is announced as ignored.',
          'A password manager autofill fills all slots in one change event.',
          'Paste permission denied falls back to typing; nothing is lost.',
          'A wrong code keeps the digits selected so retyping replaces all six at once.',
          'Reduced motion changes nothing: the error does not animate.',
        ]}
        keys={[
          '0–9 — fill the current slot and advance',
          'Backspace — clear and walk back',
          '←/→ — move between slots',
          '⌘V / Ctrl+V — fill the row',
          'Enter — submit when complete',
        ]}
      />
    </Page>
  )
}

export const inputPages: Record<string, ComponentType> = {
  'components/field': FieldPage,
  'components/input': InputPage,
  'components/textarea': TextareaPage,
  'components/chip': ChipPage,
  'components/date-picker': DatePickerPage,
  'components/number-input': NumberInputPage,
  'components/otp-input': OtpInputPage,
}
