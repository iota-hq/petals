import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { Check, ChevronRight, Copy } from 'lucide-react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Dot } from '../bits'
import { cn } from '@/lib/utils'

/* -------------------------------- Code block ------------------------------- */

const SCENE_JSON = `{
  "format": "petals.scene",
  "version": 1,
  "board": {
    "id": "brd_8f21",
    "name": "Landing page",
    "width": 1440,
    "height": 900
  },
  "pages": [
    {
      "id": "pge_home",
      "name": "Home",
      "frames": [
        {
          "id": "frm_hero",
          "name": "Hero",
          "x": 0,
          "y": 0,
          "width": 1440,
          "height": 720,
          "fills": [
            { "type": "solid", "color": "#08080a" }
          ]
        },
        {
          "id": "frm_grid",
          "name": "Feature grid",
          "x": 0,
          "y": 760,
          "width": 1440,
          "height": 480,
          "fills": []
        }
      ]
    }
  ],
  "layers": 68,
  "assets": 4,
  "exportedAt": "2026-03-04T10:12:44Z"
}`

type TokenKind = 'key' | 'string' | 'number' | 'punct' | 'plain'
type Token = { text: string; kind: TokenKind }

const KIND_CLASS: Record<TokenKind, string> = {
  key: 'text-[#f0a6d0]',
  string: 'text-foreground/80',
  number: 'text-[#ececf1]',
  punct: 'text-muted-foreground/45',
  plain: 'text-foreground/80',
}

function tokenize(line: string): Token[] {
  const tokens: Token[] = []
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|([{}\[\],:])|(\s+)/g
  let last = 0
  let match = re.exec(line)
  while (match) {
    if (match.index > last) tokens.push({ text: line.slice(last, match.index), kind: 'plain' })
    if (match[1]) {
      tokens.push({ text: match[1], kind: match[2] ? 'key' : 'string' })
      if (match[2]) tokens.push({ text: match[2], kind: 'punct' })
    } else if (match[3]) {
      tokens.push({ text: match[3], kind: 'number' })
    } else if (match[4]) {
      tokens.push({ text: match[4], kind: 'punct' })
    } else if (match[5]) {
      tokens.push({ text: match[5], kind: 'plain' })
    }
    last = re.lastIndex
    match = re.exec(line)
  }
  if (last < line.length) tokens.push({ text: line.slice(last), kind: 'plain' })
  return tokens
}

function useCopied() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  function copy(key: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1200)
  }
  return { copied, copy }
}

function CopyCode({ text }: { text: string }) {
  const { copied, copy } = useCopied()
  return (
    <>
      <button
        type="button"
        onClick={() => copy('code', text)}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-white/5 hover:text-foreground"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  )
}

function Code({
  source,
  numbers = true,
  maxHeight = 260,
  label = 'Code',
}: {
  source: string
  numbers?: boolean
  maxHeight?: number
  label?: string
}) {
  const lines = source.split('\n')
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="scrollbar-thin overflow-auto bg-[#0b0b0d] font-mono text-[11.5px] leading-[18px] text-foreground/80 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52525b]/70"
      style={{ maxHeight }}
    >
      <div className="min-w-max py-2">
        {lines.map((line, i) => (
          <div key={i} className="flex h-[18px] whitespace-pre">
            {numbers && (
              <span
                aria-hidden="true"
                className="sticky left-0 w-9 shrink-0 select-none bg-[#0b0b0d] pr-3 text-right text-[10px] text-muted-foreground/30"
              >
                {i + 1}
              </span>
            )}
            <code className={numbers ? 'pr-4' : 'px-3'}>
              {tokenize(line).map((t, j) => (
                <span key={j} className={KIND_CLASS[t.kind]}>
                  {t.text}
                </span>
              ))}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

function CodeBlockPage() {
  return (
    <Page
      title="Code block"
      lead="Read-only source on a black surface. Line numbers optional, copy always there."
      spec
      meta="11.5px Geist Mono · 32px header · 260px cap"
    >
      <Section title="Block" note="scene.json · export">
        <Stage caption="The header carries the file and the language. The body scrolls inside its cap; the page never grows.">
          <div className="overflow-hidden rounded-lg border border-border bg-[#0b0b0d]">
            <div className="flex h-8 items-center justify-between border-b border-border/70 px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[11px] text-foreground/75">scene.json</span>
                <span className="font-mono text-[10px] text-muted-foreground/40">json</span>
              </div>
              <CopyCode text={SCENE_JSON} />
            </div>
            <Code source={SCENE_JSON} maxHeight={260} label="JSON code" />
          </div>
        </Stage>
      </Section>

      <Section title="Line numbers" note="optional">
        <Tiles
          min={260}
          items={[
            {
              label: 'numbers',
              note: 'exports over 10 lines',
              node: (
                <div className="w-full overflow-hidden rounded-md border border-border">
                  <Code source={SCENE_JSON} maxHeight={108} label="JSON code" />
                </div>
              ),
            },
            {
              label: 'no numbers',
              note: 'inline snippets',
              node: (
                <div className="w-full overflow-hidden rounded-md border border-border">
                  <Code source={SCENE_JSON} numbers={false} maxHeight={108} label="JSON code" />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one block">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'surface', value: '#0b0b0d', note: 'same as a tile' },
            { name: 'border', value: '1px #27272f', note: 'the only frame' },
            { name: 'font', value: '11.5px / 18px', note: 'Geist Mono' },
            { name: 'header', value: '32px', note: 'language + copy' },
            { name: 'gutter', value: '36px', note: 'line numbers, 10px' },
            { name: 'hues', value: '3 max', note: 'key #f0a6d0' },
            { name: 'max height', value: '260px', note: 'body scrolls inside' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Two hues carry the syntax: keys are pink-200 and strings stay quiet grey. Punctuation is
            the third tone. Anything more is a theme, not a design.
          </Note>
        </div>
      </Section>

      <Usage
        when="Showing an export, a config or a command the user will read or copy. Not for prose, and not for editing — an editable value belongs in a field."
        rules={[
          'One surface per block. Never nest it in a card that already draws a border.',
          'Three hues at most: keys, strings, punctuation. No rainbow theme.',
          'Line numbers are off in inline contexts and on for exports over ten lines.',
          'Wrap stays off. A long line scrolls sideways inside the block.',
          'The copy action copies the whole snippet, never a single line.',
          'Height caps at 260px: the body scrolls, the page does not.',
        ]}
        checks={[
          'The body is a labelled code region and names its language in text, not only by colour.',
          'The copy button changes its accessible name to “Copied” and announces it politely.',
          'A scrollable body is keyboard reachable and keeps the header visible.',
          'Line numbers are aria-hidden so they are not read between tokens.',
        ]}
        edges={[
          'A snippet longer than the cap keeps its header fixed and scrolls only the body.',
          'A very long single line creates a horizontal scrollbar in the body, never on the page.',
          'Clipboard permission denied: keep the text selectable and say “Press Ctrl+C to copy”.',
          'Tabs and leading spaces are preserved literally; never trim an indented line.',
          'An empty snippet shows the header and a 40px empty body, not an error.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- JSON view ------------------------------- */

type JsonLeaf = string | number | boolean | null

type JsonNode =
  | { key: string; kind: 'object' | 'array'; children: JsonNode[] }
  | { key: string; kind: 'leaf'; value: JsonLeaf }

const SCENE: JsonNode = {
  key: '$',
  kind: 'object',
  children: [
    { key: 'format', kind: 'leaf', value: 'petals.scene' },
    { key: 'version', kind: 'leaf', value: 1 },
    {
      key: 'pages',
      kind: 'array',
      children: [
        {
          key: '0',
          kind: 'object',
          children: [
            { key: 'id', kind: 'leaf', value: 'pge_home' },
            { key: 'name', kind: 'leaf', value: 'Home' },
            {
              key: 'frames',
              kind: 'array',
              children: [
                {
                  key: '0',
                  kind: 'object',
                  children: [
                    { key: 'id', kind: 'leaf', value: 'frm_hero' },
                    { key: 'name', kind: 'leaf', value: 'Hero' },
                    { key: 'width', kind: 'leaf', value: 1440 },
                    { key: 'height', kind: 'leaf', value: 720 },
                    { key: 'locked', kind: 'leaf', value: false },
                    {
                      key: 'fills',
                      kind: 'array',
                      children: [
                        {
                          key: '0',
                          kind: 'object',
                          children: [
                            { key: 'type', kind: 'leaf', value: 'solid' },
                            { key: 'color', kind: 'leaf', value: '#08080a' },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  key: '1',
                  kind: 'object',
                  children: [
                    { key: 'id', kind: 'leaf', value: 'frm_grid' },
                    { key: 'name', kind: 'leaf', value: 'Feature grid' },
                    { key: 'width', kind: 'leaf', value: 1440 },
                    { key: 'height', kind: 'leaf', value: 480 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'assets',
      kind: 'array',
      children: [
        {
          key: '0',
          kind: 'object',
          children: [
            { key: 'id', kind: 'leaf', value: 'ast_cover' },
            { key: 'bytes', kind: 'leaf', value: 290816 },
            { key: 'mime', kind: 'leaf', value: 'image/png' },
          ],
        },
      ],
    },
    { key: 'layers', kind: 'leaf', value: 68 },
    { key: 'exportedAt', kind: 'leaf', value: '2026-03-04T10:12:44Z' },
  ],
}

const INITIAL_EXPANDED = [
  '$',
  '$.pages',
  '$.pages[0]',
  '$.pages[0].frames',
  '$.pages[0].frames[0]',
  '$.pages[0].frames[0].fills',
]

function countNodes(node: JsonNode): number {
  if (node.kind === 'leaf') return 1
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

function pathOf(parentPath: string, parent: JsonNode, key: string): string {
  if (parent.kind === 'array') return `${parentPath}[${key}]`
  return parentPath === '$' ? `$.${key}` : `${parentPath}.${key}`
}

function JsonTree({
  node,
  path,
  depth,
  arrayItem = false,
  expanded,
  onToggle,
  copied,
  onCopy,
}: {
  node: JsonNode
  path: string
  depth: number
  arrayItem?: boolean
  expanded: Set<string>
  onToggle: (path: string) => void
  copied: string | null
  onCopy: (path: string) => void
}) {
  const open = expanded.has(path)
  const container = node.kind !== 'leaf'

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={container ? open : undefined}
      aria-label={path}
    >
      <div
        className="group flex h-[22px] items-center gap-1 pr-1.5 hover:bg-white/[0.03]"
        style={{ paddingLeft: depth * 16 + 6 }}
      >
        {container ? (
          <button
            type="button"
            onClick={() => onToggle(path)}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${path}`}
            aria-expanded={open}
            className="flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground/50 transition-colors hover:text-foreground"
          >
            <ChevronRight size={10} className={cn('transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span
          className={cn(
            'shrink-0 font-mono text-[11.5px]',
            arrayItem ? 'text-muted-foreground/50' : 'text-[#f0a6d0]',
          )}
        >
          {node.key}
        </span>
        <span className="shrink-0 font-mono text-[11.5px] text-[#6b6b76]">:</span>

        {node.kind === 'leaf' ? (
          <span
            className={cn(
              'max-w-[380px] truncate font-mono text-[11.5px]',
              typeof node.value === 'number' ? 'text-foreground/85' : 'text-[#9a9aa4]',
            )}
          >
            {typeof node.value === 'string' ? `"${node.value}"` : String(node.value)}
          </span>
        ) : (
          <span className="font-mono text-[11.5px] text-[#6b6b76]">
            {node.kind === 'object' ? '{' : '['}
            {!open && (
              <>
                <span className="px-1 text-muted-foreground/40">…</span>
                <span className="text-[10px] text-muted-foreground/40">{node.children.length}</span>
                <span className="ml-1">{node.kind === 'object' ? '}' : ']'}</span>
              </>
            )}
          </span>
        )}

        <button
          type="button"
          onClick={() => onCopy(path)}
          aria-label={`Copy path ${path}`}
          className={cn(
            'ml-auto flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground/40 transition-opacity hover:bg-white/10 hover:text-foreground',
            copied === path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          {copied === path ? <Check size={10} /> : <Copy size={10} />}
        </button>
      </div>

      {node.kind !== 'leaf' && open && (
        <div role="group">
          {node.children.map((child) => {
            const childPath = pathOf(path, node, child.key)
            return (
              <JsonTree
                key={childPath}
                node={child}
                path={childPath}
                depth={depth + 1}
                arrayItem={node.kind === 'array'}
                expanded={expanded}
                onToggle={onToggle}
                copied={copied}
                onCopy={onCopy}
              />
            )
          })}
          <div
            className="flex h-[22px] items-center font-mono text-[11.5px] text-[#6b6b76]"
            style={{ paddingLeft: depth * 16 + 6 }}
          >
            <span className="w-4 shrink-0" />
            {node.kind === 'object' ? '}' : ']'}
          </div>
        </div>
      )}
    </div>
  )
}

const JSON_NODE_COUNT = countNodes(SCENE)

function JsonViewPage() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(INITIAL_EXPANDED))
  const { copied, copy } = useCopied()

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <Page
      title="JSON view"
      lead="A read-only tree for scene.json. Collapse a branch to see its count."
      spec
      meta="11.5px mono · 16px indent · 22px rows"
    >
      <Section title="Tree" note="scene.json · read-only">
        <Stage caption="Keys are pink-200. Array indices stay muted. Hover a row for its path.">
          <div className="overflow-hidden rounded-lg border border-border bg-[#08080a]">
            <div className="flex h-8 items-center justify-between border-b border-border/70 px-3">
              <span className="font-mono text-[10px] text-muted-foreground/50">scene.json</span>
              <span className="font-mono text-[10px] text-muted-foreground/40">read-only</span>
            </div>
            <div
              role="tree"
              aria-label="scene.json tree"
              className="scrollbar-thin max-h-[320px] overflow-auto py-1"
            >
              <JsonTree
                node={SCENE}
                path="$"
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                copied={copied}
                onCopy={(path) => copy(path, path)}
              />
            </div>
            <div className="flex h-7 items-center justify-between border-t border-border/70 px-3 font-mono text-[10px] text-muted-foreground/45">
              <span>{JSON_NODE_COUNT} nodes</span>
              <span aria-live="polite" className="truncate pl-3">
                {copied ? `copied ${copied}` : 'hover a row to copy its path'}
              </span>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one node">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'font', value: '11.5px mono', note: 'no proportional text' },
            { name: 'indent', value: '16px per level', note: 'no guide lines' },
            { name: 'key', value: '#f0a6d0', note: 'array indices muted' },
            { name: 'string', value: '#9a9aa4', note: 'quotes kept' },
            { name: 'number', value: '#ececf1', note: 'no quotes' },
            { name: 'count', value: '10px', note: 'collapsed nodes only' },
            { name: 'row', value: '22px', note: 'copy path on hover' },
            { name: 'virtualise', value: '> 500 nodes', note: 'below that, render all' },
          ]}
        />
      </Section>

      <Usage
        when="Inspecting a document the product produced: an export, a native payload or an MCP tool result. It is read-only; the user is looking, not editing."
        rules={[
          'Objects and arrays collapse. Leaves never do.',
          'Indent 16px per level and no guide lines; depth is the structure.',
          'A collapsed node shows its child count. An expanded node does not.',
          'Copy path is the only action and it copies the path, not the value.',
          'Above 500 nodes the tree virtualises; below that it renders whole.',
          'Strings keep their quotes. Numbers never gain them.',
        ]}
        checks={[
          'Use role=tree with treeitem and group roles, and aria-expanded on every container.',
          'Left and right arrows collapse and expand; up and down move between rows.',
          'Copy path names the full path in its accessible label.',
          'The copied path is announced politely in the strip, not as a toast.',
        ]}
        edges={[
          'A key containing a dot copies in bracket form: $["page.name"].',
          'An empty object or array shows a zero count and no disclosure arrow.',
          'A 2MB payload truncates below depth six with “Show more” instead of freezing.',
          'A circular reference in native inspection shows [Circular] instead of recursing.',
          'Clipboard denied: the path appears in the strip so it can be selected by hand.',
          'A string over 80 characters truncates with the full value in its title.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Log viewer ------------------------------- */

type Level = 'info' | 'warn' | 'error'

type LogLine = {
  id: number
  time: string
  date: string
  level: Level
  message: string
}

const LEVEL_COLOR: Record<Level, string> = {
  info: '#9a9aa4',
  warn: '#f59e0b',
  error: '#ef4444',
}

const LOG: LogLine[] = [
  {
    id: 1,
    time: '10:12:02.114',
    date: '2026-03-04T10:12:02.114Z',
    level: 'info',
    message: 'export started · scene.json · 68 layers',
  },
  {
    id: 2,
    time: '10:12:02.231',
    date: '2026-03-04T10:12:02.231Z',
    level: 'info',
    message: 'resolved 4 image assets from /assets',
  },
  {
    id: 3,
    time: '10:12:02.480',
    date: '2026-03-04T10:12:02.480Z',
    level: 'warn',
    message: 'font "Geist Variable" subset · 2 weights skipped',
  },
  {
    id: 4,
    time: '10:12:02.902',
    date: '2026-03-04T10:12:02.902Z',
    level: 'info',
    message: 'wrote frames/hero.svg · 412 KB',
  },
  {
    id: 5,
    time: '10:12:03.117',
    date: '2026-03-04T10:12:03.117Z',
    level: 'error',
    message: 'asset hero-cover.png missing · using placeholder · relink the fill and export again',
  },
  {
    id: 6,
    time: '10:12:03.208',
    date: '2026-03-04T10:12:03.208Z',
    level: 'info',
    message: 'export finished · 6 files · 1.9 MB · 1.1s',
  },
]

function LogViewer({
  lines,
  running = false,
}: {
  lines: LogLine[]
  running?: boolean
}) {
  const [follow, setFollow] = useState(true)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0b0b0d]">
      <div className="flex h-8 items-center justify-between border-b border-border/70 px-3">
        <span className="font-mono text-[10px] text-muted-foreground/50">export.log</span>
        <button
          type="button"
          onClick={() => setFollow((v) => !v)}
          aria-pressed={follow}
          className="flex h-5 cursor-pointer items-center gap-1.5 rounded-full px-1.5 text-[10px] text-muted-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <Dot color={follow ? '#ececf1' : '#52525b'} size={5} />
          Follow
        </button>
        <span role="status" aria-live="polite" className="sr-only">
          {follow ? 'Follow on' : 'Follow off'}
        </span>
      </div>

      <div
        role="log"
        aria-label="Export log"
        aria-live={running ? 'polite' : 'off'}
        tabIndex={0}
        className="scrollbar-thin max-h-[232px] overflow-auto focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-[#52525b]"
      >
        {lines.length === 0 ? (
          <div className="flex h-[128px] flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="font-mono text-[11px] text-foreground/60">No output yet</p>
            <p className="text-[10.5px] text-muted-foreground/45">
              Start an export to fill the log.
            </p>
          </div>
        ) : (
          <ol className="min-w-max py-1">
            {lines.map((line) => (
              <li key={line.id} className="flex h-[22px] items-center gap-2 px-3 hover:bg-white/[0.03]">
                <time
                  dateTime={line.date}
                  className="w-[76px] shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/50"
                >
                  {line.time}
                </time>
                <Dot color={LEVEL_COLOR[line.level]} size={5} />
                <span className="sr-only">{line.level}</span>
                <span className="whitespace-nowrap font-mono text-[11.5px] text-[#c9c9d2]">
                  {line.message}
                </span>
              </li>
            ))}
            {running && (
              <li className="flex h-[22px] items-center gap-2 px-3">
                <span className="w-[76px] shrink-0" />
                <Dot color="#9a9aa4" size={5} pulse />
                <span className="sr-only">info</span>
                <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground/50">
                  waiting for the native exporter…
                </span>
              </li>
            )}
          </ol>
        )}
      </div>

      <div className="flex h-7 items-center justify-between border-t border-border/70 px-3 text-[10px] text-muted-foreground/45">
        <span>
          {lines.length} lines · {running ? 'running' : 'run ended'}
        </span>
        <span className="font-mono">UTC</span>
      </div>
    </div>
  )
}

function LogViewerPage() {
  return (
    <Page
      title="Log viewer"
      lead="The exporter's own words. One line per event, newest at the bottom, follow on."
      spec
      meta="11.5px mono · 22px rows · wrap off"
    >
      <Section title="Log" note="export · finished">
        <Stage caption="Follow keeps the newest line in view. Wrap stays off, so the missing asset line scrolls sideways.">
          <div className="max-w-[560px]">
            <LogViewer lines={LOG} />
          </div>
        </Stage>
      </Section>

      <Section title="States" note="empty · running">
        <Tiles
          min={300}
          items={[
            {
              label: 'empty',
              note: 'before the run',
              node: (
                <div className="w-full">
                  <LogViewer lines={[]} />
                </div>
              ),
            },
            {
              label: 'running',
              note: 'follow on',
              node: (
                <div className="w-full">
                  <LogViewer lines={LOG.slice(0, 2)} running />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one line">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'row', value: '22px', note: 'no borders between' },
            { name: 'timestamp', value: '10px mono', note: 'muted, ms included' },
            { name: 'level dot', value: '5px', note: 'info · warn · error' },
            { name: 'message', value: '11.5px mono', note: 'never wraps' },
            { name: 'wrap', value: 'off', note: 'scrolls sideways' },
            { name: 'follow', value: 'toggle', note: 'stays on while running' },
            { name: 'empty', value: '128px', note: 'one sentence, no icon' },
          ]}
        />
      </Section>

      <Usage
        when="A long-running export, import or bridge handshake where the user needs the exact sequence and the reason it failed. Not for one success message — that is a toast."
        rules={[
          'One row per event, 22px, newest at the bottom.',
          'The level dot is the only colour; the message stays #c9c9d2.',
          'Timestamps are 10px mono and include milliseconds.',
          'Wrap is off; a long message widens its row and the log scrolls sideways.',
          'Follow is on by default and is the only control in the header.',
          'A failed run keeps every line. Clearing the log is a separate action.',
        ]}
        checks={[
          'Entries are an ordered list inside a role=log region, live only while running.',
          'The level is in the row text, not carried by colour alone.',
          'Follow is a toggle with aria-pressed, and enabling it is announced.',
          'The scroll region is focusable, labelled, and does not trap the arrow keys.',
        ]}
        edges={[
          'Ten thousand lines virtualise, with Follow anchored to the bottom.',
          'A message with no spaces scrolls its row, never the page.',
          'The exporter dies mid-run: append an error line and “run ended”, and leave Follow on.',
          'Closing the sheet keeps the run; reopening resumes at the bottom when Follow is on.',
          'A second run while one is active queues and says so in an info line.',
        ]}
      />
    </Page>
  )
}

export const codePages: Record<string, ComponentType> = {
  'components/code-block': CodeBlockPage,
  'components/json-view': JsonViewPage,
  'components/log-viewer': LogViewerPage,
}
