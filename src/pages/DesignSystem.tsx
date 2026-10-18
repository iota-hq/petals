import { go } from '@/App'
import { PageMenu, pillDark, pillLight, FlowerLogo } from '@/components/PageMenu'
import { ChevronLeft, Plus } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Playground — every token, component and interaction Petals uses,    */
/* rendered live, with the file where each is applied.                 */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  ['colors', 'Colors'],
  ['typography', 'Typography'],
  ['buttons', 'Buttons & pills'],
  ['radius', 'Radius'],
  ['shadows', 'Shadows'],
  ['fill', 'Fill'],
  ['panels', 'Panel system'],
  ['icons', 'Icons'],
  ['motion', 'Motion'],
  ['spacing', 'Spacing & surfaces'],
  ['rules', 'Rules & state'],
  ['map', 'File map'],
] as const

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-border pt-8 pb-2">
      <h2 className="text-[20px] font-medium tracking-[-0.01em]">{title}</h2>
      {note && <p className="mt-1 text-[12px] text-[#8B8C8D]">{note}</p>}
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  )
}

/** token / value / where row used by every token table. */
function Token({ name, value, where, children: _c, className }: { name: string; value: string; where: string; children?: React.ReactNode; className?: string }) {
  void _c
  return (
    <div className={'grid grid-cols-[112px_1fr_168px] items-baseline gap-3 border-b border-border py-2 ' + (className ?? '')}>
      <code className="font-mono text-[11px] text-[#f472b6]">{name}</code>
      <span className="min-w-0 text-[12px] text-foreground/85">{value}</span>
      <span className="text-right font-mono text-[10px] text-muted-foreground/70">{where}</span>
    </div>
  )
}

function Demo({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-[#141418] p-4">
      {children}
      {label && <span className="font-mono text-[10px] text-muted-foreground/70">{label}</span>}
    </div>
  )
}

function Swatches({ items }: { items: Array<[string, string, string, string]> }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
      {items.map(([hex, name, role, where]) => (
        <div key={name + hex} className="rounded-xl border border-border bg-[#141418] p-3">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-lg border border-white/10" style={{ background: hex }} />
            <div className="text-[12px] leading-tight">
              <div className="font-medium">{name}</div>
              <div className="font-mono text-[10px] text-muted-foreground/70">{hex}</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-foreground/80">{role}</div>
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{where}</div>
        </div>
      ))}
    </div>
  )
}

export default function DesignSystem() {
  return (
    <div className="relative min-h-dvh bg-black text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,114,182,0.14), transparent 70%)' }}
      />
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-white/10 bg-black/80 px-5 backdrop-blur">
        <button
          onClick={() => go('/')}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Back"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[13px] font-semibold">Design system</span>
        <FlowerLogo size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => go('/projects')} className={pillDark}>
            Projects
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-10">
        <PageMenu />

        <div className="mb-8 flex items-center gap-3">
          <FlowerLogo size={40} />
          <div>
            <h1 className="text-[30px] font-normal leading-none tracking-[-0.02em]">Petals playground</h1>
            <p className="mt-1.5 text-[12px] text-[#8B8C8D]">
              Every token, component and interaction used across petals, with where each is applied.
            </p>
          </div>
        </div>

        {/* in-page index */}
        <nav className="mb-4 flex flex-wrap gap-1.5">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={pillDark + ' !h-7 !px-3 !text-[12px]'}>
              {label}
            </a>
          ))}
        </nav>

        {/* ------------------------------------ colors ------------------------------------ */}
        <Section id="colors" title="Colors" note="Identity pink heads every surface; grays carry the panels. The pink is never used as a border or focus ring — focus is neutral (--ring gray).">
          <Swatches
            items={[
              ['#e063bb', 'petals pink', 'Brand mark, gradients, cursor', 'petal-flower.svg · CanvasHost'],
              ['#f472b6', 'primary --primary', 'Canvas selection, layer highlight bg-primary/15, reorder bars', 'index.css · NodeView · SelectionOverlay'],
              ['#000000', 'page black', 'Landing, dashboard, editor body', 'Landing · Dashboard · EditorPage'],
              ['#8B8C8D', 'muted copy', 'Hero second line, subtitles', 'Landing.tsx'],
              ['#262626', 'pill surface', 'Menu / Open app / Log in pills', 'components/PageMenu.tsx'],
              ['#2b2b2b', 'field surface', 'NumField, MiniSelect, color rows, page rows', 'PropertiesPanel · LeftPanel'],
              ['#1c1c1c', 'panel body', 'Left panel aside, empty page rows', 'LeftPanel.tsx'],
              ['#141418', 'card', '--card; cards & popovers daylight', 'index.css'],
              ['#52525b', '--ring gray', 'Focus rings + selected field rings', 'ui/input.tsx · PropertiesPanel'],
              ['#424242', 'canvas 404040', 'Default canvas background', 'petal.canvasBg · Page section'],
            ]}
          />
          <Demo label="gradients">
            <div className="flex gap-2">
              <span className="h-8 flex-1 rounded-lg" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,114,182,0.25), transparent 70%)' }} />
              <span className="h-8 flex-1 rounded-lg" style={{ background: 'linear-gradient(135deg, #f472b6, #a855f7)' }} />
              <span className="h-8 flex-1 rounded-lg" style={{ background: 'radial-gradient(circle at 30% 30%, #f472b6, #a855f7)' }} />
            </div>
          </Demo>
        </Section>

        {/* ---------------------------------- typography ---------------------------------- */}
        <Section id="typography" title="Typography" note="Geist Variable + Geist Mono only (public/fonts). Hero and headings use tight negative tracking; numbers may use tabular-nums.">
          <div className="overflow-x-auto">
            <Token name="hero h1" value="text-[34px] md:text-[38px] font-normal leading-[1.18] tracking-[-0.02em]" where="Landing hero" />
            <Token name="page title" value="text-[34px] md:text-[38px] font-medium tracking-[-0.015em]" where="Dashboard 'Projects'" />
            <Token name="page h1" value="text-[30px] font-normal tracking-[-0.02em]" where="DesignSystem title" />
            <Token name="section h2" value="text-[20px] font-medium tracking-[-0.01em]" where="DesignSystem sections" />
            <Token name="panel label" value="text-[13px] font-semibold tracking-[0.01em] text-foreground/90" where="Panel/Pages/Layers headers" />
            <Token name="field value" value="text-[13px] font-medium (mono when hex)" where="NumField · ColorBoxRow" />
            <Token name="pill label" value="text-[13px] font-medium" where="pillDark / pillLight" />
            <Token name="pill hero" value="text-[14px] font-medium" where="pillHero 'Try out'" />
            <Token name="row label" value="text-[12px] font-medium" where="Layer rows, page rows" />
            <Token name="micro" value="text-[10px] font-normal text-muted-foreground/70 — sentence case (no uppercase)" where="popover headers (Add filter · Add shadow · Gradient direction)" />
          </div>
          <Demo label="live samples">
            <div className="flex flex-col gap-3 text-start">
              <span className="text-[34px] font-normal leading-[1.18] tracking-[-0.02em] text-foreground">Design, prototype, and ship,</span>
              <span className="text-[26px] font-normal tracking-[-0.02em] text-[#8B8C8D]">all in your browser.</span>
              <span className="text-[20px] font-medium tracking-[-0.01em]">Projects</span>
              <span className="text-[13px] font-semibold tracking-[0.01em] text-foreground/90">Layers</span>
              <span className="font-mono text-[12px] uppercase text-foreground/85">D9D9D9</span>
            </div>
          </Demo>
        </Section>

        {/* ------------------------------------ buttons ----------------------------------- */}
        <Section id="buttons" title="Buttons & pills" note="Secondary is always dark; white is for primary actions only. Every clickable is cursor-pointer.">
          <Demo label="pillDark · components/PageMenu.tsx — h-9 rounded-full bg-[#262626] px-4 text-[13px] font-medium hover:bg-[#333333]">
            <div className="flex flex-wrap items-center gap-2">
              <button className={pillDark}>Menu</button>
              <button className={pillDark}>
                Open app <span className="font-mono text-[11px] text-muted-foreground"> →</span>
              </button>
              <button className={pillDark}>Log in</button>
            </div>
          </Demo>
          <Demo label="pillLight · components/PageMenu.tsx — h-9 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-950">
            <div className="flex flex-wrap items-center gap-2">
              <button className={pillLight}>
                <Plus size={14} /> New project
              </button>
              <button className={pillLight}>Create your first project</button>
            </div>
          </Demo>
          <Demo label="pillHero · src/pages/Landing.tsx — h-11 px-6 text-[14px] rounded-full bg-white">
            <button className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full bg-white px-6 text-[14px] font-medium text-neutral-950 transition-colors hover:bg-white/90">
              Try out <span className="font-mono text-[12px] text-neutral-500"> →</span>
            </button>
          </Demo>
          <Demo label="toolbar pill · src/editor/Toolbar.tsx (own radius, not changed with panels)">
            <div className="flex h-10 w-fit items-center gap-1 rounded-full bg-[#232329] px-2 shadow-2xl shadow-black/50">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#f472b6] text-black">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3 3l7 18 2.5-7.5L20 11z" />
                </svg>
              </span>
              {['frame', 'rect', 'ellipse', 'text'].map((t) => (
                <span key={t} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground">
                  <span className="size-2.5 border border-current" style={{ borderRadius: t === 'ellipse' ? '9999px' : '2px' }} />
                </span>
              ))}
            </div>
          </Demo>
        </Section>

        {/* ------------------------------------ radius ------------------------------------ */}
        <Section id="radius" title="Radius" note="Scale by role — tokens are Tailwind classes; the toolbar pill keeps its own rounded-full.">
          <div className="overflow-x-auto">
            <Token name="4px rounded" value="small swatches (ColorButton sm)" where="PropertiesPanel ColorButton" />
            <Token name="6px rounded-md" value="tool glyphs, small icon buttons" where="Toolbar · panel icon chips" />
            <Token name="6px rounded-md" value="every /board surface — NumField, MiniSelect, color rows, page rows, shadow blocks AND panel popover menus" where="PropertiesPanel · LeftPanel" />
            <Token name="12px rounded-xl" value="toolbar popovers, video card, cards on landing & this page" where="Toolbar.tsx · Landing · DesignSystem" />
            <Token name="20px rounded-[20px]" value="project cards" where="Dashboard ProjectCard" />
            <Token name="9999 rounded-full" value="pills, dots, toolbar, gradient stop chips" where="everywhere" />
          </div>
          <Demo label="corner radius edited per corner — public/TablerBorderRadius.png rotated for TL / TR / BR / BL">
            <div className="flex items-center gap-3">
              {[0, 90, 180, 270].map((deg) => (
                <span key={deg} className="flex size-7 items-center justify-center rounded-md bg-[#2b2b2b]">
                  <img src="/TablerBorderRadius.png" alt="" className="size-4" style={{ transform: `rotate(${deg}deg)` }} />
                </span>
              ))}
              <span className="ml-2 text-[11px] text-[#8B8C8D]">uniform field keeps the Pictogrammers radius glyph</span>
            </div>
          </Demo>
        </Section>

        {/* ------------------------------------ shadows ----------------------------------- */}
        <Section id="shadows" title="Shadows" note="An element carries any mix of several box + inner shadows; the canvas composes them (shadowToCss, inner entries get inset). Defaults: x0 · y8 · blur24 · spread0 · #00000066.">
          <div className="overflow-x-auto">
            <Token name="shadow block" value="fields X / Y / blur / spread + color row — one block per shadow" where="PropertiesPanel ShadowsSection" />
            <Token name="add menu" value="fixed popover, 'Add shadow' header (sentence case), box + inner rows" where="ShadowsSection addSlot" />
            <Token name="multishadow" value="every pick appends another shadow entry" where="Shape.shadows[]" />
          </div>
          <Demo label="shadow blocks (live markup mirrors ShadowBlock)">
            {(['Box shadow', 'Inner shadow'] as const).map((title, i) => (
              <div key={title} className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center gap-1.5">
                  <span className="flex shrink-0 items-center text-muted-foreground">
                    {i === 0 ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 8.5a1 1 0 0 1 1-1H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" opacity="0.45" /><path d="M2 4.5a1 1 0 0 1 1-1h14.5a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm2 1v8.5h12.5V5.5z" /></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16" /><path d="M12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14m0 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10" opacity="0.45" /></svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-left text-[13px] font-semibold tracking-[0.01em] text-foreground/90">{title}</span>
                  <span className="text-[11px] text-muted-foreground">−</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['X 0', 'Y 8', 'Blur 24', 'Spread 0'] as const).map((f) => (
                    <span key={f} className="flex h-7 items-center gap-1 rounded-md bg-[#2b2b2b] px-1.5 text-[13px] font-medium text-foreground/90">
                      <span className="text-[11px] text-muted-foreground/80">{f.split(' ')[0]}</span>
                      <span className="ml-auto">{f.split(' ')[1]}</span>
                    </span>
                  ))}
                </div>
                <span className="flex h-7 items-center gap-1.5 rounded-md bg-[#2b2b2b] px-1.5 font-mono text-[12px] uppercase text-foreground/85">
                  <span className="size-4 rounded bg-[#00000066] ring-1 ring-white/20" />
                  000000 <span className="ml-auto not-italic text-muted-foreground">%</span> 40
                </span>
              </div>
            ))}
          </Demo>
        </Section>

        {/* ------------------------------------- fill ------------------------------------- */}
        <Section id="fill" title="Fill" note="One flat icon row picks the paint; Gradient opens a nested direction menu (Linear / Radial / Conic), then a plain bar with stops. Image fill defaults to /petal-pattern.svg.">
          <div className="overflow-x-auto">
            <Token name="kind row" value="flat icon row — Solid · Gradient · Image, active sits on bg-[#2b2b2b]" where="PropertiesPanel FillField" />
            <Token name="gradient default" value="2 stops: current color → #ffffff, angle 90" where="setGradient()" />
            <Token name="image default" value="src=/petal-pattern.svg, fit cover" where="PLACEHOLDER_IMAGE" />
            <Token name="stop chip" value="size-3 round, border-2 white (no pink)" where="GradientBar" />
          </div>
          <Demo label="kind row + nested direction menu">
            <div className="flex w-fit items-center gap-1.5">
              {(['Rect', 'Gradient', 'Img'] as const).map((k, idx) => (
                <span key={k} className={'flex size-7 items-center justify-center rounded-md ' + (idx === 1 ? 'bg-[#2b2b2b] text-foreground' : 'text-muted-foreground')}>
                  <span className="size-3 border-2 border-current" style={{ borderRadius: k === 'Rect' ? '2px' : '9999px' }} />
                </span>
              ))}
              <Plus size={13} className="ml-auto text-muted-foreground" />
            </div>
            <div className="mt-2 w-[180px] rounded-md border border-border bg-[#1a1a20] py-1.5 shadow-2xl">
              <div className="px-2.5 pb-1 pt-0.5 text-[10px] text-muted-foreground/70">Gradient direction</div>
              {(['Linear 90°', 'Radial', 'Conic'] as const).map((t, i) => (
                <div key={t} className={'flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-foreground/90 ' + (i === 0 ? 'bg-[#1e1e25]' : '')}>
                  <span className="size-3 rounded-full border border-muted-foreground/70" />
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-2 h-3.5 rounded-md ring-1 ring-inset ring-black/20" style={{ background: 'radial-gradient(circle at 50% 50%, #f472b6, #ffffff)' }} />
          </Demo>
        </Section>

        {/* ------------------------------------ panels ------------------------------------ */}
        <Section id="panels" title="Panel system" note="Right properties panel + left layers panel primitives. Every field box is #2b2b2b with neutral focus (--ring); pink never borders a field.">
          <div className="overflow-x-auto">
            <Token name="Section" value="collapsible; one +/− indicator; border-b #27272f; slides on title click" where="PropertiesPanel.tsx" />
            <Token name="Row" value="flex gap-1.5 field group" where="PropertiesPanel.tsx" />
            <Token name="NumField" value="scrubbable number: drag label/icon to scrub, click to type; rounded-md bg-[#2b2b2b]" where="PropertiesPanel.tsx NumField" />
            <Token name="ColorBoxRow" value="swatch + hex + % alpha, opens ColorPopover (hex picker), min-2 stops guard on gradients" where="PropertiesPanel.tsx" />
            <Token name="MiniSelect" value="text select opening a fixed popover list" where="PropertiesPanel.tsx" />
            <Token name="Hint" value="hover tooltip on every icon-only control" where="components/ui/tooltip.tsx" />
            <Token name="usePopFixed" value="popover anchored over the canvas, flush to the panel's left edge" where="PropertiesPanel.tsx" />
            <Token name="Pages list" value="row width matches layers exactly (mx-1.5, h-6.5); active bg-[#2b2b2b]; dblclick rename; minus deletes (confirm)" where="LeftPanel.tsx PagesList" />
            <Token name="Layers" value="tree rows, drag to reorder/reparent (pink inset bars are the only pink chrome)" where="LeftPanel.tsx" />
          </div>
          <Demo label="NumField + ColorBoxRow look (static replica)">
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md bg-[#2b2b2b] px-1.5 text-[13px] font-medium">
                <span className="w-3.5 cursor-ew-resize text-center text-[11px] text-muted-foreground">8</span>
                <span className="ml-auto">Border radius</span>
              </span>
            </div>
            <span className="flex h-7 items-center gap-1.5 rounded-md bg-[#2b2b2b] px-1.5 font-mono text-[12px] uppercase text-foreground/85">
              <span className="size-4 rounded bg-[#d9d9d9]" /> D9D9D9 <span className="ml-auto text-muted-foreground">%</span> 100
            </span>
          </Demo>
        </Section>

        {/* ------------------------------------ icons ------------------------------------- */}
        <Section id="icons" title="Icons" note="proIcons.tsx pulls from open icon sets — see ATTRIBUTION.md. lucide-react only for app chrome.">
          <div className="overflow-x-auto">
            <Token name="in-house" value="IconLinear (gradient stops + direction line), IconBoxShadow, IconInnerShadow" where="proIcons.tsx" />
            <Token name="Nimbus" value="IconDragCanvas + field glyphs (size, line-height, letter-spacing…)" where="proIcons.tsx · Toolbar" />
            <Token name="Myna UI" value="IconSolidFill" where="proIcons.tsx" />
            <Token name="Material Symbols" value="IconGradientFill, IconImageFill, IconBlur…" where="proIcons.tsx" />
            <Token name="Pictogrammers" value="IconRadius, IconSpread…" where="proIcons.tsx" />
            <Token name="Tabler" value="border radius corner mark (PNG, rotated per corner)" where="public/TablerBorderRadius.png" />
            <Token name="Fluent / Microsoft" value="IconSepia" where="proIcons.tsx" />
          </div>
        </Section>

        {/* ------------------------------------ motion ------------------------------------ */}
        <Section id="motion" title="Motion" note="motion/react everywhere. One easing family: [0.22, 1, 0.36, 1] with gentle rises; page menu is slower and subtle.">
          <div className="overflow-x-auto">
            <Token name="entrance" value="opacity 0→1 + 14–20px rise, 0.5–0.7s, staggered ~0.1s, ease [0.22,1,0.36,1]" where="Landing · Dashboard" />
            <Token name="page route" value="AnimatePresence mode=wait, cross-fade 0.22s" where="App.tsx" />
            <Token name="board loader" value="petals flower, own 6.67s spin, overlay ~1s" where="App.tsx BoardLoader" />
            <Token name="page menu" value="options drop in 0.5s, 0.1s stagger, y −10 → 0" where="components/PageMenu.tsx" />
            <Token name="hover" value="color/opacity only; no card hover animations" where="Dashboard · rules" />
            <Token name="toolbar hover" value="group micro-slides (chevron −x 0.5, 150ms)" where="LeftPanel.tsx" />
          </div>
        </Section>

        {/* ----------------------------- spacing & surfaces ------------------------------ */}
        <Section id="spacing" title="Spacing & surfaces" note="Relaxed airy layout: sections breathe with py-3 stacks of 1.5 gaps; landing paddings px-6 / max-w-5xl.">
          <div className="overflow-x-auto">
            <Token name="panel section" value="px-3.5 py-3, children space-y-1.5, border-b" where="PropertiesPanel Section" />
            <Token name="list rows" value="h-6.5, mx-1.5, gap-2, rounded-md" where="LeftPanel rows" />
            <Token name="fields" value="h-7 chips, px-1.5, gap-1 (4 fields per Row)" where="NumField" />
            <Token name="landing rhythm" value="pt-28 hero → video section pb-16 → footer h-12" where="Landing.tsx" />
            <Token name="dashboard" value="max-w-6xl px-6 pt-14 md:pt-20, cards minmax(220px,1fr) grid" where="Dashboard.tsx" />
            <Token name="panels widths" value="left aside w-60 · right w-60 at lg  (both hide under lg)" where="EditorPage" />
          </div>
        </Section>

        {/* ---------------------------------- rules/state --------------------------------- */}
        <Section id="rules" title="Rules & state" note="Non-negotiables applied across the app.">
          <div className="overflow-x-auto">
            <Token name="commands & tx" value="all doc mutations through commands / docStore tx APIs; history holds structuredClone snapshots — never Immer drafts" where="commands.ts · docStore.ts" />
            <Token name="pointer" value="cursor-pointer on everything clickable; no helper texts in the UI" where="everywhere" />
            <Token name="pink scope" value="pink = selection & brand only; field borders/focus are neutral gray (--ring #52525b)" where="index.css · panels" />
            <Token name="persistence" value="petal.projects.v1 · petal.doc.v1.&lt;id&gt; (400ms debounce, v1 nodes+pages) · petal.canvasBg" where="projectsStore · docStore" />
            <Token name="pages" value="doc pages[] + activePage; Shape.pageId; legacy docs migrate to one 'Page 1'" where="types.ts · docStore · World.tsx" />
            <Token name="export" value="SVG/PNG/PDF/HTML exporters render the live doc — shadows as CSS, gradients as defs" where="exporters.ts" />
          </div>
        </Section>

        {/* ----------------------------------- file map ----------------------------------- */}
        <Section id="map" title="File map" note="Where each system lives.">
          <div className="overflow-x-auto">
            <Token name="src/editor/PropertiesPanel.tsx" value="fill · radius · shadows · filters · typography · align sections, NumField/ColorBoxRow/Section primitives" where="" />
            <Token name="src/editor/LeftPanel.tsx" value="Pages + Layers lists, drag/reparent" where="" />
            <Token name="src/editor/NodeView.tsx" value="DOM shape renderer, shadow/fill/transform composition" where="" />
            <Token name="src/editor/commands.ts" value="create/move/resize/order/marquee/select/camera commands" where="" />
            <Token name="src/store/docStore.ts" value="doc + history (tx) + pages + 400ms save" where="" />
            <Token name="src/store/uiStore.tsx" value="camera · selection · gesture · tool state" where="" />
            <Token name="src/model/*" value="types, schema (zod), geometry, styles→css bridge, defaults" where="" />
            <Token name="src/components/PageMenu.tsx" value="Menu pill + page links + pill styles shared by pages" where="" />
            <Token name="src/pages/*" value="Landing · Dashboard · DesignSystem (this page) · About · Careers · Gallery" where="" />
            <Token name="public/" value="favicon.svg (tilted) · petal-flower.svg (spinning) · petals-og.png · demo.mp4 · petal-pattern.svg · TablerBorderRadius.png" where="" />
          </div>
        </Section>
      </main>

      <footer className="relative z-10 flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/40">
        petals is under development
      </footer>
    </div>
  )
}
