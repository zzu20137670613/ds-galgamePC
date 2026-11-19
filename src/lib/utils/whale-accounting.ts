export const ACCOUNTING_VERSION = 1
const SCALE = 100000000

export function moneyUnits(value: number): number {
  const n = Number(value)
  const units = Math.round(n * SCALE)
  if (!Number.isFinite(n) || !Number.isSafeInteger(units)) throw new Error('金额无效或超出可记账范围')
  return units
}

export function preciseMoney(value: number): number { return moneyUnits(value) / SCALE }
export function addMoney(a: number, b: number): number { return sumMoney([a, b]) }
export function sumMoney(values: number[]): number {
  let units = 0
  for (const value of values) units += moneyUnits(value)
  if (!Number.isSafeInteger(units)) throw new Error('金额合计超出可记账范围')
  return units / SCALE
}

export function beijingDay(time: number = Date.now()): string {
  const d = new Date(Number(time) + 8 * 3600000)
  if (!Number.isFinite(d.getTime())) throw new Error('无效的观测时间')
  return d.toISOString().slice(0, 10)
}

export function dayOffset(day: string, offset: number): string {
  return beijingDay(Date.parse(day + 'T00:00:00+08:00') + offset * 86400000)
}

interface DayRow {
  day: string
  firstAt: number
  lastAt: number
  openingUnits: number
  lastUnits: number
  debitUnits: number
  creditUnits: number
  revision: number
  correction: Correction | null
  correctionLog?: CorrectionLogEntry[]
}

interface Correction {
  at: number
  creditsUnits: number
  otherDebitsUnits: number
  amountUnits: number
  debitUnits: number
  creditUnits: number
}

interface CorrectionLogEntry {
  at: number
  previous: Correction | null
  next: Correction | null
}

interface Book {
  currency: string
  days: Record<string, DayRow>
  lastAt?: number
}

interface Books {
  [scope: string]: Book
}

export interface Accounting {
  version: number
  active: string
  books: Books
  migratedAt: number
  legacyHistory: Record<string, number>
}

export interface BalanceSnapshot {
  at: number
  balance: number
  currency: string
  scope: string
}

export interface BalanceSummary {
  day: string
  amount: number
  currency: string
  source: string
  label: string
  firstObservedAt: number
  lastObservedAt: number
  openingBalance: number
  currentBalance: number
  observedDecrease: number
  observedIncrease: number
  needsReview: boolean
  revision: string
  partialDay: boolean
  observedFromMs: number | null
  observedToMs: number | null
  leadingGapMs: number | null
  trailingGapMs: number
  credits: number | null
  otherDebits: number | null
  correctedAt: number | null
}

export interface DaySummary extends BalanceSummary {
  eventEstimate: number
  eventCurrency: string
  bookBreakdown: BookBreakdownRow[]
  bookCount: number
  otherBookAmount?: number
  historyHint?: string
}

interface BookBreakdownRow {
  scope: string
  currency: string
  active: boolean
  lastAt: number
  amount: number
  firstObservedAt: number
  lastObservedAt: number
  needsReview: boolean
}

export interface Ledger {
  date: string
  lastBalance: number
  todayUsage: number
  history: Record<string, number>
  events: LedgerEvent[]
  dayStart: number
  accounting: Accounting
}

export interface LedgerEvent {
  ts: number
  day: string
  model: string
  cost: number
  tokens: number
}

const PARTIAL_GAP_MS = 10 * 60 * 1000

function partialDayOf(day: string, row: DayRow | null, now: number): boolean {
  try {
    const start = Date.parse(String(day) + 'T00:00:00+08:00')
    if (!Number.isFinite(start)) return true
    const end = start + 86400000
    const first = Number(row && row.firstAt)
    const last = Number(row && row.lastAt)
    if (!Number.isFinite(first) || !Number.isFinite(last)) return true
    const beforeGap = first - start
    const afterGap = Number(now) >= end ? (end - last) : 0
    return beforeGap > PARTIAL_GAP_MS || afterGap > PARTIAL_GAP_MS
  } catch (_err) { return true }
}

export function partialDayInfo(day: string, row: { firstAt?: number; lastAt?: number } | null, now: number = Date.now()) {
  const start = Date.parse(String(day) + 'T00:00:00+08:00')
  const partialDay = partialDayOf(day, row as DayRow | null, now)
  const first = Number(row && row.firstAt)
  const last = Number(row && row.lastAt)
  return {
    partialDay,
    observedFromMs: Number.isFinite(first) ? first : null,
    observedToMs: Number.isFinite(last) ? last : null,
    leadingGapMs: Number.isFinite(first) && Number.isFinite(start) ? Math.max(0, first - start) : null,
    trailingGapMs: Number.isFinite(last) && Number.isFinite(start) && now >= start + 86400000 ? Math.max(0, start + 86400000 - last) : 0,
  }
}

function currentBook(ledger: Ledger): Book | null {
  const a = ledger.accounting
  return a && a.version === ACCOUNTING_VERSION && a.books && a.books[a.active] || null
}

interface BookMeta {
  scope: string
  book: Book
  active: boolean
  lastAt: number
}

function booksOf(ledger: Ledger): BookMeta[] {
  const a = ledger.accounting
  if (!a || a.version !== ACCOUNTING_VERSION || !a.books) return []
  const out: BookMeta[] = []
  for (const scope of Object.keys(a.books)) {
    const book = a.books[scope]
    if (!book || !book.days) continue
    out.push({ scope, book, active: scope === a.active, lastAt: Number(book.lastAt) || 0 })
  }
  return out
}

export function bookBreakdown(ledger: Ledger, day: string): BookBreakdownRow[] {
  const rows: BookBreakdownRow[] = []
  for (const { scope, book, active, lastAt } of booksOf(ledger)) {
    const row = book.days[day]
    if (!row) continue
    rows.push({
      scope, currency: book.currency, active, lastAt,
      amount: preciseMoney(observedAmount(row)),
      firstObservedAt: row.firstAt, lastObservedAt: row.lastAt,
      needsReview: row.creditUnits > (row.correction ? row.correction.creditUnits : 0),
    })
  }
  return rows.sort((a, b) => (a.active === b.active ? (b.lastAt - a.lastAt) : (a.active ? -1 : 1)))
}

export function accountingDays(ledger: Ledger): string[] {
  const set = new Set<string>()
  for (const { book } of booksOf(ledger)) for (const d of Object.keys(book.days || {})) set.add(d)
  return Array.from(set).sort()
}

function observedAmount(day: DayRow): number {
  const c = day.correction
  return (c ? c.amountUnits + day.debitUnits - c.debitUnits : day.debitUnits) / SCALE
}

function revisionOf(ledger: Ledger, row: DayRow): string {
  return [ledger.accounting.active, row.day, row.firstAt, row.lastUnits,
    row.debitUnits, row.creditUnits, row.revision || 0].join(':')
}

export function balanceSummary(ledger: Ledger, day: string = beijingDay()): BalanceSummary | null {
  const book = currentBook(ledger)
  const row = book && book.days && book.days[day]
  if (!row) return null
  const correction = row.correction
  const needsReview = row.creditUnits > (correction ? correction.creditUnits : 0)
  const source = needsReview ? 'balance-needs-review' : correction ? 'balance-corrected' : 'balance-observed'
  return {
    day, amount: preciseMoney(observedAmount(row)), currency: book!.currency, source,
    label: needsReview ? '已观测消费 · 待核对余额调整' : correction ? '已校正消费' : '已观测消费',
    firstObservedAt: row.firstAt, lastObservedAt: row.lastAt,
    openingBalance: row.openingUnits / SCALE, currentBalance: row.lastUnits / SCALE,
    observedDecrease: row.debitUnits / SCALE, observedIncrease: row.creditUnits / SCALE,
    needsReview, revision: revisionOf(ledger, row),
    ...partialDayInfo(day, row),
    credits: correction ? correction.creditsUnits / SCALE : null,
    otherDebits: correction ? correction.otherDebitsUnits / SCALE : null,
    correctedAt: correction ? correction.at : null,
  }
}

export function observeBalance(ledger: Ledger, snapshot: BalanceSnapshot): BalanceSummary | null {
  const at = Number(snapshot.at ?? Date.now())
  const day = beijingDay(at)
  const units = moneyUnits(snapshot.balance)
  const currency = String(snapshot.currency || 'CNY').toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('余额币种无效')
  const scope = String(snapshot.scope || 'default')
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(scope)) throw new Error('账户标识无效')
  const context = scope + '-' + currency
  let a = ledger.accounting
  if (!a || a.version !== ACCOUNTING_VERSION) {
    a = ledger.accounting = {
      version: ACCOUNTING_VERSION, active: context, books: {}, migratedAt: at,
      legacyHistory: { ...(ledger.history || {}) },
    }
  }
  a.books ||= {}
  let book = a.books[context]
  if (!book) book = a.books[context] = { currency, days: {} }
  if (book.lastAt != null && at <= book.lastAt) return balanceSummary(ledger, ledger.date)
  a.active = context
  let row = book.days[day]
  if (!row) {
    row = book.days[day] = {
      day, firstAt: at, lastAt: at, openingUnits: units, lastUnits: units,
      debitUnits: 0, creditUnits: 0, revision: 0, correction: null,
    }
  } else {
    const delta = row.lastUnits - units
    if (delta > 0) row.debitUnits += delta
    if (delta < 0) row.creditUnits -= delta
    row.lastUnits = units
    row.lastAt = at
  }
  book.lastAt = at
  ledger.date = day
  ledger.dayStart = row.openingUnits / SCALE
  ledger.lastBalance = row.lastUnits / SCALE
  const summary = balanceSummary(ledger, day)
  if (summary) {
    ledger.todayUsage = summary.amount
    ledger.history ||= {}
    ledger.history[day] = summary.amount
  }
  return summary
}

export function eventEstimate(ledger: Ledger, day: string): number {
  return sumMoney((Array.isArray(ledger.events) ? ledger.events : [])
    .filter(e => e.day === day).map(e => Number(e.cost) || 0))
}

export function daySummary(ledger: Ledger, day: string): DaySummary {
  const observed = balanceSummary(ledger, day)
  const estimate = eventEstimate(ledger, day)
  const books = bookBreakdown(ledger, day)
  const others = books.filter(b => !b.active)
  const otherSame = others.filter(b => !observed || b.currency === observed.currency)
  const common = { eventEstimate: estimate, eventCurrency: 'CNY', bookBreakdown: books, bookCount: books.length }
  if (observed) {
    if (!otherSame.length) return { ...observed, ...common }
    const other = sumMoney(otherSame.map(b => b.amount))
    const tail = others.length > otherSame.length ? '（另有其它币种 ' + (others.length - otherSame.length) + ' 本）' : ''
    return {
      ...observed, ...common, otherBookAmount: other,
      historyHint: '另有 ' + otherSame.length + ' 个历史记账本（换过 API key）· ' + other.toFixed(2) + tail,
    }
  }
  const fromOther = others[0]
  if (fromOther) {
    return {
      day, amount: fromOther.amount, currency: fromOther.currency,
      source: 'balance-observed-other-account', label: '已观测消费 · 历史账户',
      firstObservedAt: fromOther.firstObservedAt, lastObservedAt: fromOther.lastObservedAt,
      needsReview: fromOther.needsReview, ...common,
      ...partialDayInfo(day, { firstAt: fromOther.firstObservedAt, lastAt: fromOther.lastObservedAt }),
    } as DaySummary
  }
  const history = ledger.accounting ? ledger.accounting.legacyHistory : ledger.history
  const h = history && history[day]
  const hasHistory = typeof h === 'number' && Number.isFinite(h)
  return {
    day, amount: hasHistory ? preciseMoney(h) : estimate, currency: 'CNY',
    source: hasHistory ? 'legacy' : 'events', label: hasHistory ? '旧版记录 · 未校正' : '本地估算',
    partialDay: true, ...common,
  } as DaySummary
}