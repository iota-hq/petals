import { useState, type ComponentType } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { SelectField } from '../bits'

const BLEND = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Colour dodge', 'Colour burn']

function Menu({
  options,
  value,
  onPick,
  disabled,
  width = 192,
}: {
  options: string[]
  value: string
  onPick: (v: string) => void
  disabled?: string[]
  width?: number
}) {
  return (
    <div
      className="rounded-md border border-border bg-[#1a1a20]/95 py-1 shadow-2xl shadow-black/60 backdrop-blur"
      style={{ width }}
    >
      {options.map((o) => {
        const off = disabled?.includes(o)
        return (
          <button
            key={o}
            type="button"
            title={off ? 'Coming soon' : undefined}
            onClick={() => !off && onPick(o)}
            className={
              'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium ' +
              (off
                ? 'cursor-default text-muted-foreground/45'
                : 'cursor-pointer text-foreground/90 hover:bg-white/[0.06]')
            }
          >
            <span className="flex-1 truncate">{o}</span>
            {o === value && <Check size={12} className="shrink-0 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}

function LiveSelect({
  options = BLEND,
  value: initial = 'Normal',
  disabled,
  className,
}: {
  options?: string[]
  value?: string
  disabled?: string[]
  className?: string
}) {
  const [value, setValue] = useState(initial)
  const [open, setOpen] = useState(false)
  return (
    <div className={'relative ' + (className ?? 'w-[192px]')}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          'flex h-7 w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-md border border-transparent px-2 text-[12px] font-medium text-foreground/90 hover:border-border focus:outline-none ' +
          (open ? 'bg-[#25252b] ring-1 ring-white/10' : 'bg-[#2b2b2b]')
        }
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={12}
          className={'shrink-0 text-muted-foreground transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5">
          <Menu
            options={options}
            value={value}
            disabled={disabled}
            onPick={(v) => {
              setValue(v)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

function SelectPage() {
  return (
    <Page
      title="Select"
      lead="One value from a short list. A 28px field opens a 192px menu over the canvas, not under the panel."
      meta="28px trigger · 192px menu · 4–12 options"
    >
      <Section title="Styles" note="closed and open">
        <Tiles
          items={[
            { label: 'rest', note: 'Normal', node: <SelectField value="Normal" className="w-[168px]" /> },
            { label: 'hover', note: 'border', node: <SelectField value="Normal" state="hover" className="w-[168px]" /> },
            { label: 'open', note: 'chevron turned', node: <LiveSelect value="Multiply" /> },
            { label: 'disabled', note: '40%', node: <SelectField value="Normal" state="disabled" className="w-[168px]" /> },
          ]}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-[#0f0f12] p-3">
            <div className="mb-2 font-mono text-[10px] text-muted-foreground/50">menu · rest</div>
            <Menu options={BLEND.slice(0, 6)} value="Multiply" onPick={() => {}} />
          </div>
          <div className="rounded-lg border border-border bg-[#0f0f12] p-3">
            <div className="mb-2 font-mono text-[10px] text-muted-foreground/50">menu · disabled entry</div>
            <Menu options={['Normal', 'Multiply', 'Screen', 'Noise']} value="Normal" disabled={['Noise']} onPick={() => {}} />
          </div>
        </div>
      </Section>

      <Section title="Live" note="click the field">
        <Stage caption="The trigger toggles. Picking closes; pressing the trigger again closes without changing the value.">
          <div className="flex flex-wrap items-start gap-8">
            <LiveSelect />
            <LiveSelect value="Screen" />
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-muted-foreground/55">Narrow field, two choices</span>
              <LiveSelect options={['Fit', 'Fill']} value="Fit" className="w-[112px]" />
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'trigger', value: '28px · radius 6', note: 'field height, full width' },
            { name: 'fill', value: '#2b2b2b', note: 'same as every field' },
            { name: 'label', value: '12px · 500', note: 'truncates, never wraps' },
            { name: 'chevron', value: 'Lucide 12', note: 'muted, turns when open' },
            { name: 'menu', value: '192px', note: 'fixed, over the canvas' },
            { name: 'item', value: '28px · px 10', note: '12px, hover fills' },
            { name: 'check', value: '12px · pink', note: 'marks the current value' },
            { name: 'offset', value: '6px below', note: 'flips above near the bottom' },
          ]}
        />
        <div className="mt-4">
          <Note>
            The menu is positioned from the trigger but drawn to the left of the panel, flush with
            its border — a select near the bottom of the panel opens upward rather than off-screen.
          </Note>
        </div>
      </Section>

      <Section title="Long lists" note="truncate, don't scroll">
        <Stage caption="Options are short by definition. A list that needs a scrollbar is a different control — a library or a picker, not a select.">
          <div className="flex flex-wrap items-start gap-5">
            <LiveSelect />
            <div className="max-w-[260px] text-[11px] leading-relaxed text-muted-foreground/55">
              Ten is the ceiling. Past that the menu is taller than the field it belongs to and the
              eye loses the selected row.
            </div>
          </div>
        </Stage>
      </Section>

      <Usage
        when="A fixed, short list of named choices: blend mode, fit, gradient type, page transition, shadow presets. The value is a word the user recognises."
        rules={[
          'The trigger always shows the current value, never a placeholder once one is set.',
          'The menu opens over the canvas, never over the panel it came from.',
          'The current value carries a pink check, so the open menu answers “what is set?”.',
          'An unavailable option is shown at 45% with “Coming soon”, never removed — the list stays predictable.',
          'Picking closes the menu; pressing the trigger again closes it without changing anything.',
          'A two-value choice may use a 112px field; never a native select.',
        ]}
        checks={[
          'aria-haspopup and aria-expanded are on the trigger; the check is not the accessible value.',
          'Tab reaches the trigger; Enter/Space opens; the items are buttons and take focus in order.',
          'Escape closes the menu and returns focus to the trigger.',
          'The label truncates with an ellipsis; the menu still shows the full name.',
        ]}
        edges={[
          'The last option near the viewport bottom flips the menu above the trigger.',
          'A disabled select keeps its value legible at 40%, not hidden.',
          'A value longer than the trigger is ellipsised, never wrapped to two lines.',
          'Two selects in one row keep their own menus; only one is open at a time.',
          'Reduced motion removes the chevron turn; the menu still opens instantly.',
        ]}
      />
    </Page>
  )
}

export const selectPages: Record<string, ComponentType> = {
  'components/select': SelectPage,
}
