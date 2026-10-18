import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { InfoShell } from '@/components/InfoShell'
import { pillLight } from '@/components/PageMenu'

const easeOut = [0.22, 1, 0.36, 1] as const

const ROLES = ['Storyboarder', 'Growth', 'Open application'] as const
const ENGAGEMENT = ['Contract', 'Full-time'] as const

const fieldCls =
  'w-full rounded-md bg-[#2b2b2b] px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors hover:border-border focus:border-ring border border-transparent cursor-text'

const ROLES_TARGET = 'divyanshsoni919@gmail.com'

/** Gmail compose draft addressed to us, everything the applicant typed prefilled. */
function gmailDraft(fields: Record<string, string>) {
  const body = [
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Phone number: ${fields.phone}`,
    `Role: ${fields.role}`,
    `Engagement: ${fields.engagement}`,
    `Portfolio: ${fields.portfolio}`,
    '',
    'Your experience',
    fields.experience,
    '',
    'Anything else',
    fields.else,
  ].join('\n')
  const url = new URL('https://mail.google.com/mail/')
  url.searchParams.set('view', 'cm')
  url.searchParams.set('fs', '1')
  url.searchParams.set('to', ROLES_TARGET)
  url.searchParams.set('su', `Applying — ${fields.role} (${fields.name})`)
  url.searchParams.set('body', body)
  window.open(url.toString(), '_blank')
}

export default function Careers() {
  const [f, setF] = useState<Record<string, string>>({
    name: '',
    email: '',
    phone: '',
    role: ROLES[0],
    engagement: ENGAGEMENT[1],
    portfolio: '',
    experience: '',
    else: '',
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }))

  return (
    <InfoShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: easeOut, delay: 0.08 }}>
        <h1 className="text-[34px] font-normal leading-tight tracking-[-0.02em]">Join the team</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#8B8C8D]">
          We&rsquo;re looking for S-tier talent who ask why things move and exist in the first place — and who, most importantly, have
          great taste.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut, delay: 0.16 }}
        className="mt-12 border-t border-border pt-8"
      >
        <h2 className="mb-1.5 text-[20px] font-medium tracking-[-0.01em]">Apply</h2>
        <p className="mb-6 text-[13px] text-muted-foreground">Tell us who you are and show us your work.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            gmailDraft(f)
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-muted-foreground">Name</span>
              <input required value={f.name} onChange={set('name')} className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-muted-foreground">Email</span>
              <input required type="email" value={f.email} onChange={set('email')} className={fieldCls} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-muted-foreground">Phone number</span>
              <input type="tel" value={f.phone} onChange={set('phone')} className={fieldCls} />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-muted-foreground">Role</span>
              <label className="relative flex cursor-pointer items-center">
                <select value={f.role} onChange={set('role')} className={fieldCls + ' appearance-none pr-8 cursor-pointer'}>
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 text-muted-foreground" />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-1/2 sm:pr-2">
            <span className="text-[12px] text-muted-foreground">Contract or full-time</span>
            <label className="relative flex cursor-pointer items-center">
              <select value={f.engagement} onChange={set('engagement')} className={fieldCls + ' appearance-none pr-8 cursor-pointer'}>
                {ENGAGEMENT.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-muted-foreground" />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted-foreground">Portfolio</span>
            <input value={f.portfolio} onChange={set('portfolio')} className={fieldCls} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted-foreground">Your experience</span>
            <textarea rows={4} value={f.experience} onChange={set('experience')} className={fieldCls + ' resize-none cursor-text'} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-muted-foreground">Anything else</span>
            <textarea rows={3} value={f.else} onChange={set('else')} className={fieldCls + ' resize-none cursor-text'} />
          </label>

          <div className="mt-2 flex items-center gap-3">
            <button type="submit" className={pillLight}>
              Send application
            </button>
            <span className="text-[11px] text-muted-foreground/70">Opens a Gmail draft addressed to us with the details filled in.</span>
          </div>
        </form>
      </motion.section>

      <p className="mt-12 text-[11px] text-white/40">© 2026 iota-hq. All rights reserved.</p>
    </InfoShell>
  )
}
