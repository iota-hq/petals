import { useState, type ComponentType } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Minus, Plus } from 'lucide-react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Swatch } from '../bits'

const CHECKER = 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 8px 8px'

function ColorRow({ value, alpha, selected }: { value: string; alpha: number; selected?: boolean }) {
  const has = value !== 'transparent'
  return (
    <div
      className={
        'flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 ' +
        (selected ? 'bg-[#353535]' : 'bg-[#2b2b2b]')
      }
    >
      <span
        className="size-4 shrink-0 rounded ring-1 ring-inset ring-white/10"
        style={{ background: has ? value : CHECKER }}
      />
      <span className="font-mono text-[12px] uppercase text-foreground/85">{has ? value.replace('#', '') : ''}</span>
      <span className="ml-auto w-10 text-right text-[11px] tabular-nums text-muted-foreground/70">{alpha}%</span>
    </div>
  )
}

function PickerTile() {
  const [color, setColor] = useState('#e063bb')
  return (
    <div className="rounded-md border border-border bg-[#1a1a20] p-2 shadow-2xl shadow-black/50">
      <div className="overflow-hidden rounded" style={{ width: 168 }}>
        <HexColorPicker color={color} onChange={setColor} style={{ width: 168, height: 120 }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="text-[10px] text-muted-foreground">Hex</span>
        <span className="flex h-6 w-[124px] items-center rounded bg-[#2b2b2b] px-2 font-mono text-[11px] uppercase text-foreground/85">
          {color}
        </span>
      </div>
    </div>
  )
}

function ColorPickerPage() {
  const [stops, setStops] = useState(['#f472b6', '#ffffff'])
  const [active, setActive] = useState(0)
  const color = stops[active] ?? '#ffffff'
  return (
    <Page
      title="Color picker"
      lead="One 28px row: swatch, hex, alpha. Clicking it opens a 192px picker that commits as you drag."
      meta="28px row · 192px popover · 2–8 stops"
    >
      <Section title="Styles" note="one control">
        <Tiles
          items={[
            { label: 'color row', note: 'rest', node: <ColorRow value="#e063bb" alpha={100} /> },
            { label: 'color row', note: 'selected stop', node: <ColorRow value="#f472b6" alpha={100} selected /> },
            { label: 'with alpha', note: '40%', node: <ColorRow value="#000000" alpha={40} /> },
            { label: 'empty', note: 'none', node: <ColorRow value="transparent" alpha={0} /> },
            { label: 'picker', note: 'open', wide: true, node: <PickerTile /> },
          ]}
        />
      </Section>

      <Section title="Gradient stops" note="min 2, max 8">
        <Stage caption="The bar is the gradient; each round chip is a stop. The selected chip carries the white ring, and its color row appears below.">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="relative h-4 flex-1 rounded-md ring-1 ring-inset ring-black/20"
                style={{ background: `linear-gradient(90deg, ${stops.join(', ')})` }}
              >
                {stops.map((s, i) => (
                  <button
                    key={i}
                    aria-label={`Stop ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={
                      'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 ' +
                      (active === i ? 'border-white' : 'border-white/60')
                    }
                    style={{ background: s, left: `${(i / (stops.length - 1)) * 100}%` }}
                  />
                ))}
              </div>
              <button
                aria-label="Add stop"
                onClick={() => stops.length < 8 && setStops([...stops, color])}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <Plus size={12} />
              </button>
              <button
                aria-label="Remove stop"
                onClick={() => stops.length > 2 && setStops(stops.filter((_, i) => i !== active))}
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <Minus size={12} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <ColorRow value={stops[active] ?? '#ffffff'} alpha={100} selected />
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'row height', value: '28px', note: 'field height' },
            { name: 'swatch', value: '16px · radius 4', note: 'checker when transparent' },
            { name: 'hex', value: 'Geist Mono 12px', note: 'uppercase, no #' },
            { name: 'alpha', value: 'right, 40px', note: 'percent, 0–100' },
            { name: 'popover', value: '192px · radius 6', note: 'anchored left of the panel' },
            { name: 'picker', value: '168 × 120', note: 'saturation + hue' },
            { name: 'commit', value: 'live', note: 'no OK button' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Picking is live and undoable as one transaction: dragging a color then releasing is a
            single “Change fill” step, not two hundred.
          </Note>
        </div>
      </Section>

      <Section title="Transparency" note="checkerboard">
        <Stage caption="Alpha is part of the value, not a separate toggle. An 8-digit hex keeps its alpha when the base colour changes.">
          <div className="flex flex-wrap items-center gap-3">
            <Swatch color="#e063bb" size={40} radius={8} />
            <span className="relative inline-flex size-10 overflow-hidden rounded-lg ring-1 ring-inset ring-white/10" style={{ background: CHECKER }}>
              <span className="absolute inset-0" style={{ background: '#e063bb80' }} />
            </span>
            <span className="relative inline-flex size-10 overflow-hidden rounded-lg ring-1 ring-inset ring-white/10" style={{ background: CHECKER }} />
            <div className="flex flex-col gap-1 font-mono text-[10px] text-muted-foreground/60">
              <span>#E063BB · 100%</span>
              <span>#E063BB80 · 50%</span>
              <span>none · 0%</span>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Live" note="drag inside the picker">
        <Stage caption="The same picker the panel uses. Hue and saturation commit as you move.">
          <div className="flex flex-wrap items-start gap-5">
            <PickerTile />
            <div className="flex max-w-[220px] flex-col gap-2">
              <ColorRow value={color} alpha={100} />
              <p className="text-[11px] leading-relaxed text-muted-foreground/55">
                The row above is the value the picker is editing. In the panel it sits at the top of
                Fill; here it follows whichever stop is selected.
              </p>
            </div>
          </div>
        </Stage>
      </Section>

      <Usage
        when="Any paint: a shape fill, a gradient stop, a stroke, a shadow, a canvas background, a pattern ink. If the value is a colour the user chooses, it is this row."
        rules={[
          'One row, one value. The swatch, hex and alpha are one control, not three.',
          'Picking commits live; there is no OK. The undo step covers the whole drag.',
          'Hex is displayed uppercase without the #, and typed with or without one.',
          'The selected gradient stop carries the white ring; the stop is never shown only by colour.',
          'Adding a stop takes the current colour; removing is blocked at two stops.',
          'Transparent is a state of the value (checkerboard), never a separate “none” switch.',
        ]}
        checks={[
          'The row is a button with an accessible name (“Fill colour, E063BB, 100%”).',
          'The hex field selects all on focus and accepts 3/6/8 digit values.',
          'Escape closes the picker and keeps the last committed colour; focus returns to the row.',
        ]}
        edges={[
          'A disabled picker still shows its colour; only interaction is removed.',
          'Pasting an invalid hex keeps the field active and does not change the document.',
          'A gradient with a transparent stop keeps the checkerboard visible behind the bar.',
          'Dragging the hue on a small panel opens the popover over the canvas, never off-screen.',
          'Alpha 0 is still a stop — removing it is a separate action.',
        ]}
      />
    </Page>
  )
}

export const colorPages: Record<string, ComponentType> = {
  'components/color-picker': ColorPickerPage,
}
