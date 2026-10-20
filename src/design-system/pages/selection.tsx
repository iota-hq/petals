import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  Blend,
  Check,
  ChevronDown,
  Clock,
  Image as ImageIcon,
  Minus,
  Search,
  Square,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Kbd, PanelFrame, PanelSection, SelectField } from '../bits'

/* --------------------------------- Checkbox -------------------------------- */

function Box({
  checked,
  indeterminate,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  label: string
  onChange?: (v: boolean) => void
}) {
  const toggle = () => {
    if (!disabled) onChange?.(!checked)
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={label}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52525b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]',
          checked || indeterminate
            ? 'border-[#f472b6] bg-[#f472b6] text-[#2b0a1c]'
            : 'border-white/25 bg-transparent hover:border-white/40',
          disabled && 'cursor-not-allowed opacity-40',
        )}
      >
        {indeterminate ? (
          <Minus size={11} strokeWidth={3} />
        ) : checked ? (
          <Check size={11} strokeWidth={3} />
        ) : null}
      </button>
      <span
        onClick={toggle}
        className={cn(
          'select-none text-[12.5px] text-foreground/85',
          disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
        )}
      >
        {label}
      </span>
    </span>
  )
}

type OptKey = 'grid' | 'snap' | 'clip'

function CheckboxPage() {
  const [opts, setOpts] = useState<Record<OptKey, boolean>>({ grid: true, snap: true, clip: false })
  const toggle = (k: OptKey) => setOpts((v) => ({ ...v, [k]: !v[k] }))
  return (
    <Page
      title="Checkbox"
      lead="An independent yes or no, confirmed in one click."
      meta="16px · 3 states"
    >
      <Section title="States" note="rest, checked, mixed">
        <Tiles
          items={[
            { label: 'unchecked', node: <Box checked={false} label="Clip content" /> },
            { label: 'checked', node: <Box checked label="Snap to pixel" /> },
            { label: 'indeterminate', note: 'mixed', node: <Box checked indeterminate label="Fill" /> },
            { label: 'disabled', node: <Box checked={false} disabled label="Clip content" /> },
            { label: 'disabled checked', node: <Box checked disabled label="Locked layer" /> },
          ]}
        />
      </Section>

      <Section title="In the panel" note="independent options">
        <Stage caption="Each option applies immediately and is independent of the others. A mixed parent resolves to checked on the next click.">
          <PanelFrame title="View" width={240} className="mx-auto">
            <PanelSection title="Canvas">
              <div className="flex h-6 items-center justify-between gap-2">
                <Box checked={opts.grid} label="Show grid" onChange={() => toggle('grid')} />
              </div>
              <div className="flex h-6 items-center justify-between gap-2">
                <Box checked={opts.snap} label="Snap to pixel" onChange={() => toggle('snap')} />
              </div>
              <div className="flex h-6 items-center justify-between gap-2">
                <Box checked={opts.clip} label="Clip content" onChange={() => toggle('clip')} />
              </div>
              <div className="flex h-6 items-center justify-between gap-2">
                <Box checked={false} disabled label="Smart guides" />
              </div>
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one box">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'box', value: '16 × 16px', note: 'fixed' },
            { name: 'radius', value: '4px', note: 'not a circle' },
            { name: 'border', value: '1px white/25', note: 'hover white/40' },
            { name: 'checked', value: '#f472b6 fill', note: 'check #2b0a1c, 11px' },
            { name: 'mixed', value: '8px dash', note: 'same fill as checked' },
            { name: 'gap', value: '8px', note: 'box → label' },
            { name: 'row', value: '24px', note: 'panel option height' },
            { name: 'focus', value: '2px #52525b', note: 'offset 2 from the box' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A checkbox is a choice confirmed with other choices; a switch applies the moment it moves.
            If the setting takes effect immediately and alone, use a switch.
          </Note>
        </div>
      </Section>

      <Usage
        when="A set of independent options inside a form or a panel, where each applies on click and none excludes another. Also for a parent row that reports a partial selection."
        rules={[
          'The label sits to the right of the box, sentence case, and the whole label is a hit target.',
          'Checked is a pink fill with a near-black check. Never a pink outline on a black box.',
          'A mixed parent shows a dash and resolves to checked on the next click, never to mixed again.',
          'Disabled options keep their checked state visible; they do not turn into unchecked boxes.',
          'One checkbox is one boolean. If two options exclude each other, they are radios.',
          'Do not use a checkbox for an instant panel setting; that is a switch.',
        ]}
        checks={[
          'Space toggles the focused box; the label is part of the accessible name.',
          'The mixed state is exposed as aria-checked="mixed", not as a visual only.',
          'The focus ring is visible against both #0b0b0d and #2b2b2b.',
          'A group of related boxes is a fieldset with a legend.',
        ]}
        edges={[
          'A label longer than the 240px panel wraps under the box without moving it.',
          'Clicking a mixed parent checks every child in one transaction.',
          'A disabled checked box still reads “checked, unavailable”.',
          'Undo after a bulk toggle restores every box at once, not one at a time.',
          'An option that disappears with the current selection leaves no empty row behind.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Radio group ------------------------------ */

type Fit = 'fill' | 'fit' | 'tile'

const FIT_OPTIONS: Array<{ id: Fit; label: string }> = [
  { id: 'fill', label: 'Fill' },
  { id: 'fit', label: 'Fit' },
  { id: 'tile', label: 'Tile' },
]

function Radio({
  label,
  selected,
  disabled,
  onSelect,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52525b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected ? 'border-[#f472b6]' : 'border-white/25',
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-[#f472b6]" />}
      </span>
      <span
        className={cn(
          'select-none text-[12.5px]',
          selected ? 'text-foreground' : 'text-foreground/75',
        )}
      >
        {label}
      </span>
    </button>
  )
}

function RadioPage() {
  const [fit, setFit] = useState<Fit>('fill')
  return (
    <Page
      title="Radio group"
      lead="One choice from a short list where every option stays visible."
      meta="16px · 6px dot · stacked or inline"
    >
      <Section title="Layout" note="stacked / inline">
        <Tiles
          min={200}
          items={[
            {
              label: 'stacked',
              note: 'default',
              node: (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[11px] text-muted-foreground">Image fit</span>
                  <div role="radiogroup" aria-label="Image fit" className="flex flex-col gap-2.5">
                    {FIT_OPTIONS.map((o) => (
                      <Radio
                        key={o.id}
                        label={o.label}
                        selected={fit === o.id}
                        onSelect={() => setFit(o.id)}
                      />
                    ))}
                  </div>
                </div>
              ),
            },
            {
              label: 'inline',
              note: '3 options',
              node: (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[11px] text-muted-foreground">Image fit</span>
                  <div role="radiogroup" aria-label="Image fit inline" className="flex items-center gap-4">
                    {FIT_OPTIONS.map((o) => (
                      <Radio
                        key={o.id}
                        label={o.label}
                        selected={fit === o.id}
                        onSelect={() => setFit(o.id)}
                      />
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="rest, selected, disabled">
        <Tiles
          items={[
            { label: 'rest', node: <Radio label="Fill" selected={false} /> },
            { label: 'selected', node: <Radio label="Fill" selected /> },
            { label: 'disabled', node: <Radio label="Tile" selected={false} disabled /> },
            { label: 'disabled selected', node: <Radio label="Fit" selected disabled /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one option">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'circle', value: '16 × 16px', note: 'always round' },
            { name: 'border', value: '1px white/25', note: 'pink when selected' },
            { name: 'dot', value: '6px', note: '#f472b6' },
            { name: 'gap', value: '8px', note: 'circle → label' },
            { name: 'row', value: '24px', note: 'stacked gap 10px' },
            { name: 'inline gap', value: '16px', note: 'three at most' },
            { name: 'group label', value: '11px', note: 'above the group' },
            { name: 'focus', value: '2px #52525b', note: 'on the whole option' },
          ]}
        />
      </Section>

      <Usage
        when="A single choice among two to five options that should all stay visible for comparison: image fit, export format, background kind. Use a select when the list is long or the space is tight."
        rules={[
          'One option is selected at all times unless the choice is optional; then offer a clear way to unset it.',
          'All options stay visible. A radio group is not a menu and does not collapse.',
          'The group gets a label above it; individual options do not repeat the group name.',
          'Stack when labels are longer than one word, go inline only for three short labels or fewer.',
          'Selecting an option applies immediately; there is no OK.',
          'A disabled option stays in place so the set does not reflow.',
        ]}
        checks={[
          'The group is role=radiogroup with an accessible name; each option is a radio.',
          'Arrow keys move the selection and focus together; Tab leaves the group.',
          'The selected state is exposed through aria-checked, not colour alone.',
          'The dot and border meet 3:1 against the panel surface.',
        ]}
        edges={[
          'A long option label wraps under the circle, never pushing the circle off the row.',
          'A disabled selected option still shows what is chosen.',
          'In a 240px panel an inline group of three becomes stacked rather than truncating.',
          'Undo after changing the choice restores the previous radio in one step.',
          'A group with every option disabled reads as unavailable, not as empty.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Switch --------------------------------- */

function Switch({
  on,
  onChange,
  disabled,
  label,
  ring,
}: {
  on: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
  label: string
  ring?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn(
        'relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52525b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d] motion-reduce:transition-none',
        on ? 'bg-[#f472b6]' : 'bg-[#3f3f46]',
        ring && 'ring-2 ring-[#52525b] ring-offset-2 ring-offset-[#0b0b0d]',
        disabled && 'cursor-not-allowed opacity-45',
      )}
    >
      <span
        className={cn(
          'block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 motion-reduce:transition-none',
          on && 'translate-x-[14px]',
        )}
      />
    </button>
  )
}

function SwitchDemo({ initial, disabled, ring }: { initial: boolean; disabled?: boolean; ring?: boolean }) {
  const [on, setOn] = useState(initial)
  return <Switch on={on} onChange={setOn} disabled={disabled} ring={ring} label="Show grid" />
}

type ViewKey = 'grid' | 'pixel' | 'snap' | 'rulers'

function SwitchPage() {
  const [view, setView] = useState<Record<ViewKey, boolean>>({
    grid: true,
    pixel: false,
    snap: true,
    rulers: false,
  })
  const toggle = (k: ViewKey) => setView((v) => ({ ...v, [k]: !v[k] }))
  return (
    <Page
      title="Switch"
      lead="A panel setting that applies the moment you flip it."
      spec
      meta="32 × 18px · 14px thumb"
    >
      <Section title="States" note="off, on, focus, disabled">
        <Tiles
          items={[
            { label: 'off', node: <SwitchDemo initial={false} /> },
            { label: 'on', node: <SwitchDemo initial /> },
            { label: 'focus', node: <SwitchDemo initial ring /> },
            { label: 'disabled off', node: <SwitchDemo initial={false} disabled /> },
            { label: 'disabled on', node: <SwitchDemo initial disabled /> },
          ]}
        />
      </Section>

      <Section title="In the panel" note="applies immediately">
        <Stage caption="The label sits outside the track and the switch holds the trailing edge of the row. Rulers are unavailable on a board without bounds.">
          <PanelFrame title="View" width={240} className="mx-auto">
            <PanelSection title="Canvas">
              <div className="flex h-6 items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/80">Show grid</span>
                <Switch on={view.grid} onChange={() => toggle('grid')} label="Show grid" />
              </div>
              <div className="flex h-6 items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/80">Pixel grid</span>
                <Switch on={view.pixel} onChange={() => toggle('pixel')} label="Pixel grid" />
              </div>
              <div className="flex h-6 items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/80">Snap to pixel</span>
                <Switch on={view.snap} onChange={() => toggle('snap')} label="Snap to pixel" />
              </div>
              <div className="flex h-6 items-center justify-between gap-2" title="Not available on this board">
                <span className="text-[12px] text-foreground/80">Rulers</span>
                <Switch on={view.rulers} disabled label="Rulers" />
              </div>
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one switch">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'track', value: '32 × 18px', note: 'padded 2px' },
            { name: 'radius', value: '9999px', note: 'full pill' },
            { name: 'thumb', value: '14px', note: 'white, no icon' },
            { name: 'travel', value: '14px', note: '2 → 16' },
            { name: 'on', value: '#f472b6', note: 'off #3f3f46' },
            { name: 'label', value: 'outside, left', note: 'never inside the track' },
            { name: 'motion', value: '150ms', note: 'none under reduced motion' },
            { name: 'focus', value: '2px #52525b', note: 'offset 2' },
          ]}
        />
      </Section>

      <Usage
        when="A panel option that takes effect immediately and owns one boolean: grid, snapping, rulers, auto-save. The label sits beside it and the row updates the board at once."
        rules={[
          'Use a switch only when the change is immediate. If the setting needs a Save, use a checkbox in a form.',
          'No text inside the track and no ON/OFF. The label outside names the setting; position carries the state.',
          'Do not use a switch for a destructive or irreversible setting. That is a button with a confirmation.',
          'One switch, one setting. A switch that changes several things is a preset and belongs in a menu.',
          'The label is a noun phrase: Show grid, Pixel grid, Snap to pixel.',
          'The row does not reflow when toggled; only the thumb and track colour change.',
        ]}
        checks={[
          'The switch exposes role=switch and aria-checked; Space toggles it.',
          'The accessible name is the visible label; there is no “on” or “off” in the name.',
          'The switch has a 2px neutral focus ring, and the thumb stays visible against both track colours.',
          'The 150ms thumb movement is removed under prefers-reduced-motion.',
        ]}
        edges={[
          'A disabled switch shows its current position, not an empty track.',
          'A setting that fails to apply flips back and says why in a toast.',
          'A switch that controls an expensive action debounces the board update.',
          'The row title explains why a disabled switch cannot move.',
          'Toggling during an active gesture waits for the gesture to commit.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Slider --------------------------------- */

function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ticks,
  label,
}: {
  value: number
  onChange?: (v: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ticks?: boolean
  label: string
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100
  return (
    <div className={cn('relative flex h-6 w-full items-center', disabled && 'opacity-45')}>
      <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#3f3f46]" />
      <span
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#f472b6]"
        style={{ width: `${pct}%` }}
      />
      {ticks && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-px">
          {[0, 25, 50, 75, 100].map((t) => (
            <span key={t} className="h-2 w-px bg-white/20" />
          ))}
        </span>
      )}
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ececf1] [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black/30 [&:focus-visible::-webkit-slider-thumb]:ring-2 [&:focus-visible::-webkit-slider-thumb]:ring-[#52525b] [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#ececf1]"
      />
    </div>
  )
}

function ValueBox({ value, unit }: { value: number; unit?: string }) {
  return (
    <span className="flex h-7 w-12 shrink-0 items-center justify-end gap-0.5 rounded bg-[#2b2b2b] px-1.5 font-mono text-[10.5px] text-foreground/80">
      {value}
      {unit && <span className="text-muted-foreground/60">{unit}</span>}
    </span>
  )
}

function SliderRow({
  label,
  value,
  unit,
  onChange,
  ticks,
}: {
  label: string
  value: number
  unit?: string
  onChange: (v: number) => void
  ticks?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[52px] shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <Slider label={label} value={value} onChange={onChange} ticks={ticks} />
      <ValueBox value={value} unit={unit} />
    </div>
  )
}

function SliderDemo({
  label,
  initial,
  unit,
  max,
  ticks,
  disabled,
}: {
  label: string
  initial: number
  unit?: string
  max?: number
  ticks?: boolean
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <div className="flex w-full max-w-[200px] items-center gap-2">
      <Slider
        label={label}
        value={value}
        onChange={setValue}
        max={max}
        ticks={ticks}
        disabled={disabled}
      />
      <ValueBox value={value} unit={unit} />
    </div>
  )
}

function SliderPage() {
  const [opacity, setOpacity] = useState(80)
  const [blur, setBlur] = useState(12)
  return (
    <Page
      title="Slider"
      lead="An approximate value you set by feel, beside the exact number."
      spec
      meta="4px track · 12px thumb · step 1"
    >
      <Section title="Styles" note="track and ticks">
        <Tiles
          min={244}
          items={[
            {
              label: 'plain',
              note: 'value only',
              node: <SliderDemo label="Opacity" initial={60} unit="%" />,
            },
            {
              label: 'with ticks',
              note: '5 marks',
              node: <SliderDemo label="Blur" initial={12} max={40} unit="px" ticks />,
            },
            {
              label: 'disabled',
              node: <SliderDemo label="Opacity" initial={72} unit="%" disabled />,
            },
          ]}
        />
      </Section>

      <Section title="In the panel" note="live preview">
        <Stage caption="Both sliders preview the shape while dragging and commit once on release. The value box stays exact and editable through the number input.">
          <PanelFrame title="Appearance" width={260} className="mx-auto">
            <PanelSection title="Layer">
              <SliderRow label="Opacity" value={opacity} unit="%" onChange={setOpacity} />
              <SliderRow label="Blur" value={blur} unit="px" onChange={setBlur} ticks />
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one slider">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'track', value: '4px', note: '#3f3f46' },
            { name: 'fill', value: '#f472b6', note: 'left to the thumb' },
            { name: 'thumb', value: '12px', note: '#ececf1, no border' },
            { name: 'hit area', value: '24px', note: 'row height' },
            { name: 'tick', value: '1 × 8px', note: 'white/20, optional' },
            { name: 'value field', value: '28px', note: '48px wide, right' },
            { name: 'keyboard', value: '1 · Shift 10', note: 'Home / End too' },
            { name: 'commit', value: 'once per gesture', note: 'live preview before' },
          ]}
        />
      </Section>

      <Usage
        when="An approximate value where the result is judged by eye: layer opacity, blur radius, a gradient angle. Always beside a number field or value box for the exact figure."
        rules={[
          'Label on the left, slider in the middle, exact value on the right. The same order in every panel row.',
          'Use a slider only where seeing the change matters. For a precise length, a number input is the control.',
          'The filled portion runs from the minimum to the thumb; the remaining track is #3f3f46.',
          'Ticks are optional and only at meaningful stops. A tick at every integer is noise.',
          'Step is 1 by default; opacity and percent fields step 1, never 0.01.',
          'Live preview during the drag, one transaction on release. Never one command per pixel.',
        ]}
        checks={[
          'The range input has an accessible name and exposes its value and unit.',
          'Arrow keys change the value; Home and End jump to the bounds.',
          'The thumb has a visible focus ring and a 24px hit area.',
          'The value is readable without relying on the pink fill.',
        ]}
        edges={[
          'At 240px the track still has 80px of travel after the label and value box.',
          'A disabled slider keeps its thumb and value visible.',
          'A gesture interrupted by Escape reverts to the value at pointer down.',
          'Typing in the paired number field moves the slider thumb without re-rendering the row.',
          'Touch drags grow the hit area to 24px without growing the thumb.',
        ]}
        keys={[
          '←/→ — step by 1',
          'Shift + ←/→ — step by 10',
          'Home / End — minimum / maximum',
        ]}
      />
    </Page>
  )
}

/* ----------------------------- Segmented control --------------------------- */

type SegSize = 'sm' | 'md' | 'lg'

const SEG_HEIGHT: Record<SegSize, string> = {
  sm: 'h-5 text-[10px]',
  md: 'h-6 text-[11px]',
  lg: 'h-7 text-[11.5px]',
}

function Seg({
  items,
  value,
  onChange,
  size = 'md',
  label,
  className,
}: {
  items: Array<{ id: string; label?: string; icon?: ReactNode; ariaLabel?: string }>
  value: string
  onChange?: (id: string) => void
  size?: SegSize
  label: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex w-full items-center gap-0.5 rounded-md bg-[#262626] p-0.5', className)}
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-label={it.ariaLabel ?? it.label ?? it.id}
          aria-pressed={value === it.id}
          onClick={() => onChange?.(it.id)}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded font-medium transition-colors',
            SEG_HEIGHT[size],
            value === it.id
              ? 'bg-[#353535] text-foreground'
              : 'text-muted-foreground/70 hover:text-foreground',
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}

function SegDemo({ items, size }: { items: Array<{ id: string; label: string }>; size: SegSize }) {
  const [value, setValue] = useState(items[0].id)
  return <Seg items={items} value={value} onChange={setValue} size={size} label="Sizing" />
}

type FillKind = 'solid' | 'gradient' | 'image'
type AlignPos = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br'
type Sizing = 'fixed' | 'hug'

const ALIGN_CELLS: Array<{ id: AlignPos; label: string; x: number; y: number }> = [
  { id: 'tl', label: 'Top left', x: 0, y: 0 },
  { id: 'tc', label: 'Top centre', x: 3, y: 0 },
  { id: 'tr', label: 'Top right', x: 6, y: 0 },
  { id: 'ml', label: 'Middle left', x: 0, y: 3 },
  { id: 'mc', label: 'Centre', x: 3, y: 3 },
  { id: 'mr', label: 'Middle right', x: 6, y: 3 },
  { id: 'bl', label: 'Bottom left', x: 0, y: 6 },
  { id: 'bc', label: 'Bottom centre', x: 3, y: 6 },
  { id: 'br', label: 'Bottom right', x: 6, y: 6 },
]

function AlignMatrix({ value, onChange }: { value: AlignPos; onChange: (v: AlignPos) => void }) {
  return (
    <div role="group" aria-label="Align" className="grid grid-cols-3 gap-0.5 rounded-md bg-[#262626] p-0.5">
      {ALIGN_CELLS.map((a) => (
        <button
          key={a.id}
          type="button"
          aria-label={a.label}
          aria-pressed={value === a.id}
          onClick={() => onChange(a.id)}
          className={cn(
            'flex size-6 cursor-pointer items-center justify-center rounded transition-colors',
            value === a.id ? 'bg-[#353535] text-foreground' : 'text-muted-foreground/60 hover:text-foreground',
          )}
        >
          <span className="relative size-3 rounded-[2px] border border-current opacity-70">
            <span className="absolute size-1 rounded-[1px] bg-current" style={{ left: a.x, top: a.y }} />
          </span>
        </button>
      ))}
    </div>
  )
}

function SegmentedPage() {
  const [fill, setFill] = useState<FillKind>('gradient')
  const [align, setAlign] = useState<AlignPos>('mc')
  const [sizing, setSizing] = useState<Sizing>('fixed')
  const preview =
    fill === 'solid'
      ? '#f472b6'
      : fill === 'gradient'
        ? 'linear-gradient(90deg, #f472b6, #ffffff)'
        : 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 8px 8px'
  return (
    <Page
      title="Segmented control"
      lead="Two to four modes in one box. The active mode is a filled chip."
      meta="3 sizes · 3 panel rows"
    >
      <Section title="In the panel" note="fill, align, sizing">
        <Stage caption="These are the real rows from the properties panel: icon-only for fill, a 3×3 matrix for align, two labels for sizing. The active chip is #353535 on a #262626 row.">
          <PanelFrame title="Properties" width={240} className="mx-auto">
            <PanelSection title="Fill">
              <Seg
                label="Fill kind"
                value={fill}
                onChange={(v) => setFill(v as FillKind)}
                items={[
                  { id: 'solid', icon: <Square size={13} />, ariaLabel: 'Solid fill' },
                  { id: 'gradient', icon: <Blend size={13} />, ariaLabel: 'Gradient fill' },
                  { id: 'image', icon: <ImageIcon size={13} />, ariaLabel: 'Image fill' },
                ]}
              />
              <div className="h-6 w-full rounded-md ring-1 ring-inset ring-black/20" style={{ background: preview }} />
            </PanelSection>
            <PanelSection title="Layout">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/80">Align</span>
                <AlignMatrix value={align} onChange={setAlign} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-foreground/80">Sizing</span>
                <Seg
                  label="Sizing"
                  value={sizing}
                  onChange={(v) => setSizing(v as Sizing)}
                  className="w-[132px]"
                  items={[
                    { id: 'fixed', label: 'Fixed' },
                    { id: 'hug', label: 'Hug' },
                  ]}
                />
              </div>
            </PanelSection>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Sizes" note="row height">
        <Tiles
          items={[
            {
              label: 'sm',
              note: '24px',
              node: <SegDemo size="sm" items={[{ id: 'fixed', label: 'Fixed' }, { id: 'hug', label: 'Hug' }]} />,
            },
            {
              label: 'default',
              note: '28px',
              node: <SegDemo size="md" items={[{ id: 'fixed', label: 'Fixed' }, { id: 'hug', label: 'Hug' }]} />,
            },
            {
              label: 'lg',
              note: '32px',
              node: <SegDemo size="lg" items={[{ id: 'fixed', label: 'Fixed' }, { id: 'hug', label: 'Hug' }]} />,
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one row">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'row', value: '#262626', note: 'radius 6px' },
            { name: 'padding', value: '2px', note: 'all sides' },
            { name: 'gap', value: '2px', note: 'between chips' },
            { name: 'chip', value: 'radius 4px', note: 'fills the row height' },
            { name: 'active', value: '#353535', note: 'text #ececf1' },
            { name: 'inactive', value: 'white/55', note: 'hover white/90' },
            { name: 'heights', value: '24 / 28 / 32px', note: 'sm / default / lg' },
            { name: 'icon', value: '13px', note: 'never scales with size' },
            { name: 'matrix', value: '3 × 3 · 24px cells', note: 'align only' },
          ]}
        />
      </Section>

      <Usage
        when="A mode switch inside one surface: fill kind, align position, fixed or hug sizing, text alignment. Use tabs for navigating between views; use a select when the list is longer than four."
        rules={[
          'Two to four options. Five is a menu, not a segmented row.',
          'The active chip is a fill, not an outline or an underline. Inactive labels stay quiet.',
          'Icon-only rows give every chip an aria-label and a tooltip; the icon never stands alone without a name.',
          'Sizes: 24px compact, 28px default, 32px only when the row sits alone in a dialog.',
          'Options never move between segments, and the row never wraps. Shrink labels or use icons first.',
          'The control applies on click; there is no confirm step.',
        ]}
        checks={[
          'Every chip reports aria-pressed, and the group has a name.',
          'Arrow keys move between chips inside the group; Tab leaves it.',
          'The active fill is distinguishable in greyscale as well as by colour.',
          'Icon-only chips have names that match their tooltips.',
        ]}
        edges={[
          'A 240px panel fits three icon chips at 13px with 2px gaps; four labels do not fit.',
          'A long active label truncates while the inactive chips keep their width.',
          'Changing the fill kind keeps the gradient stops when switching back.',
          'A disabled row keeps its active chip visible at 45% opacity.',
          'The align matrix clears to none when the selection mixes two alignments.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Select --------------------------------- */

const BLENDS = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Luminosity'] as const
type Blend = (typeof BLENDS)[number]

function MiniTrigger({
  value,
  open,
  onClick,
}: {
  value: string
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        'flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border border-transparent bg-[#2b2b2b] px-2 text-left font-medium text-foreground/90 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52525b]/70',
        'h-7 text-[12.5px]',
        open && 'border-white/10 bg-[#25252b]',
      )}
    >
      <span className="truncate">{value}</span>
      <ChevronDown size={12} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
    </button>
  )
}

function SelectPage() {
  const [blend, setBlend] = useState<Blend>('Normal')
  const [open, setOpen] = useState(true)
  const [hi, setHi] = useState(0)
  const enabled: Blend[] = BLENDS.filter((b) => b !== 'Luminosity')
  const openList = () => {
    setHi(Math.max(0, enabled.indexOf(blend)))
    setOpen(true)
  }
  return (
    <Page
      title="Select"
      lead="One value from a short, fixed list, opened over the canvas."
      meta="28 / 26px trigger · 192px popover"
    >
      <Section title="Trigger" note="sizes and states">
        <Tiles
          min={190}
          items={[
            { label: 'rest', note: '28px', node: <SelectField value="Normal" /> },
            { label: 'hover', node: <SelectField value="Normal" state="hover" /> },
            { label: 'focus', node: <SelectField value="Normal" state="focus" /> },
            { label: 'open', node: <SelectField value="Normal" state="open" /> },
            { label: 'disabled', node: <SelectField value="Normal" state="disabled" /> },
            { label: 'compact', note: '26px', node: <SelectField value="Luminosity" className="h-[26px] px-2 text-[12px]" /> },
          ]}
        />
      </Section>

      <Section title="Over the canvas" note="click the trigger">
        <Stage caption="The list is not a native select. It is a fixed popover anchored 8px left of the panel’s border, so it opens over the canvas and outlives the panel’s clipping.">
          <div
            className="relative min-h-[260px] w-full rounded-lg bg-[#141418] p-4 ring-1 ring-white/5"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
            }}
          >
            <div className="ml-auto w-[200px] rounded-lg border border-border bg-[#1c1c1c]">
              <div className="border-b border-border px-3 py-2 text-[11px] font-semibold text-foreground/80">
                Appearance
              </div>
              <div className="flex items-center gap-2 p-3">
                <span className="w-10 shrink-0 text-[11px] text-muted-foreground">Blend</span>
                <div
                  className="relative min-w-0 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (!open) {
                        openList()
                        return
                      }
                      const delta = e.key === 'ArrowDown' ? 1 : -1
                      setHi((i) => (i + delta + enabled.length) % enabled.length)
                    } else if (e.key === 'Enter' && open) {
                      e.preventDefault()
                      setBlend(enabled[hi])
                      setOpen(false)
                    } else if (e.key === 'Escape' && open) {
                      e.preventDefault()
                      setOpen(false)
                    }
                  }}
                >
                  <MiniTrigger value={blend} open={open} onClick={() => (open ? setOpen(false) : openList())} />
                </div>
              </div>
            </div>
            {open && (
              <div
                role="listbox"
                aria-label="Blend mode"
                className="absolute right-[208px] top-[94px] z-10 w-[192px] rounded-md border border-border bg-[#1a1a20] py-1 shadow-2xl"
              >
                {BLENDS.map((b) => {
                  const off = b === 'Luminosity'
                  const active = !off && enabled[hi] === b
                  return (
                    <button
                      key={b}
                      type="button"
                      role="option"
                      aria-selected={b === blend}
                      disabled={off}
                      title={off ? 'Coming soon' : undefined}
                      onMouseEnter={() => {
                        if (!off) setHi(enabled.indexOf(b))
                      }}
                      onClick={() => {
                        if (off) return
                        setBlend(b)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex h-7 w-full items-center gap-2 px-2.5 text-left text-[12px] font-medium',
                        off
                          ? 'cursor-default text-muted-foreground/45'
                          : 'cursor-pointer text-foreground/90',
                        active && 'bg-[#232329] text-foreground',
                      )}
                    >
                      <span className="flex-1 truncate">{b}</span>
                      {b === blend && <Check size={12} className="shrink-0 text-[#f472b6]" />}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="mt-3 text-right font-mono text-[9.5px] text-muted-foreground/40">
              Escape closes · ↑↓ moves · Enter picks
            </p>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="trigger and popover">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'trigger', value: '28 / 26px', note: 'field / compact' },
            { name: 'popover', value: '192px wide', note: 'as wide as the longest option' },
            { name: 'row', value: '28px', note: '10px horizontal padding' },
            { name: 'radius', value: '6px', note: 'trigger and popover' },
            { name: 'surface', value: '#1a1a20', note: 'border #27272f' },
            { name: 'selected', value: '#f472b6 check', note: 'label stays #ececf1' },
            { name: 'offset', value: '8px left', note: 'of the panel border' },
            { name: 'options', value: '2–12', note: 'longer lists are comboboxes' },
            { name: 'disabled', value: '45% + title', note: 'still visible' },
          ]}
        />
      </Section>

      <Usage
        when="One value from a fixed list of two to twelve options, inside a 240px panel where the label must show the current value. For more options or a searchable set, use a combobox."
        rules={[
          'The trigger shows the current value, not a placeholder. An unset select reads “Mixed” or “None”.',
          'The list opens over the canvas, 8px left of the panel border, never inside the panel’s overflow.',
          'The current option carries a pink check; a disabled option stays visible and muted.',
          'Options are sentence case and one line; the list is as wide as its longest option, capped at 192px.',
          'Selecting applies immediately and closes the list. There is no OK button.',
          'Never use a native select in the editor; the OS menu cannot match the panel or open over the canvas.',
        ]}
        checks={[
          'The trigger has a name, is a combobox button, and reports aria-expanded.',
          'Escape closes the list and returns focus to the trigger.',
          'Arrow keys move the highlight; Enter selects; the highlight is not the current value.',
          'The disabled option is skipped by the keyboard and says why in its title.',
        ]}
        edges={[
          'An empty list shows “No options” in the popover rather than opening a blank box.',
          'A long value truncates in the trigger; the popover still shows the full label.',
          'Near the bottom edge the popover flips above the trigger.',
          'Scrolling the canvas closes the popover instead of leaving it detached.',
          'A value removed from the options shows as-is until the next change.',
        ]}
        keys={[
          'Enter / Space — open',
          '↑/↓ — move the highlight',
          'Enter — select and close',
          'Escape — close without changing',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Combobox -------------------------------- */

type Asset = { name: string; group: 'Logos' | 'Textures' | 'Patterns' }

const ASSETS: Asset[] = [
  { name: 'Petals mark', group: 'Logos' },
  { name: 'Petals wordmark', group: 'Logos' },
  { name: 'Favicon', group: 'Logos' },
  { name: 'Fine grain', group: 'Textures' },
  { name: 'Mesh gradient', group: 'Textures' },
  { name: 'Halftone dots', group: 'Textures' },
  { name: 'Dot grid', group: 'Patterns' },
  { name: 'Noise field', group: 'Patterns' },
]

const RECENT = ['Petals mark', 'Fine grain', 'Dot grid']
const GROUPS: Array<Asset['group']> = ['Logos', 'Textures', 'Patterns']

function ComboboxPage() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const q = query.trim()

  const filtered = ASSETS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
  const groups = GROUPS.map((name) => ({
    name,
    items: filtered.filter((a) => a.group === name),
  })).filter((g) => g.items.length > 0)
  const flat = groups.flatMap((g) => g.items)
  const recent = RECENT.map((n) => ASSETS.find((a) => a.name === n)).filter(
    (a): a is Asset => a !== undefined,
  )
  const list = q === '' ? recent : flat

  return (
    <Page
      title="Combobox"
      lead="Type to narrow a long list; the results live in the same surface."
      meta="280px surface · grouped results · recents"
    >
      <Section title="Library search" note="type to filter">
        <Stage caption="The search field and the results share one surface. Groups appear while filtering; the empty query shows recent assets. “No matches” keeps the query and offers the clear button.">
          <div className="w-[280px] overflow-hidden rounded-xl border border-border bg-[#1a1a20] shadow-2xl">
            <div className="flex h-9 items-center gap-2 border-b border-border/80 px-3">
              <Search size={13} className="shrink-0 text-muted-foreground" />
              <input
                aria-label="Search the library"
                role="combobox"
                aria-expanded="true"
                aria-controls="library-results"
                aria-autocomplete="list"
                aria-activedescendant={
                  list[active] ? `library-${list[active].name.replace(/\s+/g, '-')}` : undefined
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (list.length > 0) setActive((i) => Math.min(list.length - 1, i + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((i) => Math.max(0, i - 1))
                  } else if (e.key === 'Enter') {
                    const item = list[active]
                    if (item) setPicked(item.name)
                  } else if (e.key === 'Escape') {
                    if (query) {
                      setQuery('')
                      setActive(0)
                    }
                  }
                }}
                placeholder="Search the library"
                className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/45"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery('')
                    setActive(0)
                  }}
                  className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground/60 hover:bg-white/5 hover:text-foreground"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[9px] text-muted-foreground/35">⌘K</span>
              )}
            </div>

            <div id="library-results" role="listbox" aria-label="Library assets" className="max-h-[220px] overflow-y-auto py-1">
              {q === '' && (
                <>
                  <div className="px-2.5 pb-1 pt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/40">
                    Recent
                  </div>
                  {recent.map((a, index) => (
                    <button
                      key={a.name}
                      id={`library-${a.name.replace(/\s+/g, '-')}`}
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => setPicked(a.name)}
                      className={cn(
                        'flex h-7 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12px]',
                        index === active
                          ? 'bg-[#262626] text-foreground'
                          : 'text-foreground/80 hover:bg-[#232329]',
                      )}
                    >
                      <Clock size={11} className="shrink-0 text-muted-foreground/60" />
                      <span className="flex-1 truncate">{a.name}</span>
                      {picked === a.name ? (
                        <Check size={11} className="shrink-0 text-[#f472b6]" />
                      ) : (
                        <span className="text-[9.5px] text-muted-foreground/40">{a.group}</span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {q !== '' && flat.length === 0 && (
                <div className="px-3 py-6 text-center">
                  <p className="text-[12.5px] text-foreground/75">No matches</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/55">
                    Nothing in the library matches “{q}”.
                  </p>
                </div>
              )}

              {q !== '' &&
                groups.map((g) => (
                  <div key={g.name}>
                    <div className="px-2.5 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/40">
                      {g.name}
                    </div>
                    {g.items.map((a) => {
                      const index = flat.indexOf(a)
                      const isActive = index === active
                      return (
                        <button
                          key={a.name}
                          id={`library-${a.name.replace(/\s+/g, '-')}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => setPicked(a.name)}
                          className={cn(
                            'flex h-7 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12px]',
                            isActive ? 'bg-[#262626] text-foreground' : 'text-foreground/80 hover:bg-[#232329]',
                          )}
                        >
                          <span className="size-3 shrink-0 rounded-[3px] bg-white/10 ring-1 ring-inset ring-white/10" />
                          <span className="flex-1 truncate">{a.name}</span>
                          {picked === a.name && <Check size={11} className="shrink-0 text-[#f472b6]" />}
                        </button>
                      )
                    })}
                  </div>
                ))}
            </div>

            <div className="flex h-7 items-center justify-between gap-2 border-t border-border/70 px-3">
              <span className="min-w-0 truncate font-mono text-[9.5px] text-muted-foreground/45">
                {picked ? `Selected: ${picked}` : 'Nothing selected'}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>↵</Kbd>
              </span>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one surface">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'surface', value: '280px', note: 'radius 12px, shadow 2xl' },
            { name: 'search', value: '36px', note: 'icon, input, clear' },
            { name: 'row', value: '28px', note: '12px label' },
            { name: 'group label', value: '9px mono', note: 'uppercase, white/40' },
            { name: 'highlight', value: '#262626', note: 'keyboard or hover' },
            { name: 'empty', value: '12.5px + hint', note: '“No matches”' },
            { name: 'results', value: 'max 220px', note: 'then scrolls' },
            { name: 'selected', value: 'pink check', note: 'after a pick' },
          ]}
        />
      </Section>

      <Usage
        when="A long or unknown list where typing is faster than scanning: the asset library, fonts, a search over layers. Use a select when the list is short, fixed and fully visible."
        rules={[
          'The input and the results share one surface. Never open a second popover under a search field.',
          'An empty query shows recents, not every asset ever imported.',
          'Group results only when there are more than eight; three groups are enough.',
          '“No matches” keeps the query visible and keeps the clear button reachable.',
          'Free text never becomes a value. Enter picks a listed row or does nothing.',
          'Show at most 50 results; past that the query is not narrow enough.',
          'The surface opens over the canvas, positioned like the select popover.',
        ]}
        checks={[
          'The input is role=combobox with aria-expanded, aria-controls and aria-activedescendant.',
          'The result count is announced politely as the query changes.',
          'Arrow keys move the active row; Enter picks it; Escape clears the query, then closes.',
          'The active row and the selected asset are different states and read differently.',
        ]}
        edges={[
          'Zero results: keep focus in the input and never move it to the empty message.',
          'A duplicate asset name shows both rows with their groups.',
          'A query of only spaces is treated as empty and shows recents.',
          'IME composition does not filter on partial characters; it waits for compositionend.',
          'Escape on a filled field clears the query but keeps the pick; a second Escape closes.',
          'A slow index keeps the previous results visible until the new ones arrive.',
        ]}
        keys={[
          '↑/↓ — move the active result',
          'Enter — pick the active result',
          'Escape — clear the query, then close',
          '⌘K — focus the library search',
        ]}
      />
    </Page>
  )
}

export const selectionPages: Record<string, ComponentType> = {
  'components/checkbox': CheckboxPage,
  'components/radio-group': RadioPage,
  'components/switch': SwitchPage,
  'components/slider': SliderPage,
  'components/segmented-control': SegmentedPage,
  'components/select': SelectPage,
  'components/combobox': ComboboxPage,
}
