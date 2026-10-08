import { Store } from "@tanstack/store"
import {
  type Ledger,
  type BalanceSummary,
  type LedgerEvent,
  observeBalance,
  balanceSummary,
  daySummary,
  beijingDay,
  moneyUnits,
  ACCOUNTING_VERSION,
} from "@/lib/utils/whale-accounting"

const LS_WHALE_LEDGER = "gal_whale_ledger"
const BALANCE_URL = "https://api.deepseek.com/user/balance"
const POLL_INTERVAL_MS = 60000

const PEAK_HOURS: [number, number][] = [[9, 12], [14, 18]]

const WEEKEND_VALLEY_FROM_SEC = Math.floor(Date.UTC(2026, 7, 22, 16, 0, 0) / 1000)

const HOLIDAY_VALLEY: Record<string, number> = {
  "2026-01-01": 1, "2026-01-02": 1, "2026-01-03": 1,
  "2026-02-15": 1, "2026-02-16": 1, "2026-02-17": 1, "2026-02-18": 1, "2026-02-19": 1,
  "2026-02-20": 1, "2026-02-21": 1, "2026-02-22": 1, "2026-02-23": 1,
  "2026-04-04": 1, "2026-04-05": 1, "2026-04-06": 1,
  "2026-05-01": 1, "2026-05-02": 1, "2026-05-03": 1, "2026-05-04": 1, "2026-05-05": 1,
  "2026-06-19": 1, "2026-06-20": 1, "2026-06-21": 1,
  "2026-09-25": 1, "2026-09-26": 1, "2026-09-27": 1,
  "2026-10-01": 1, "2026-10-02": 1, "2026-10-03": 1, "2026-10-04": 1,
  "2026-10-05": 1, "2026-10-06": 1, "2026-10-07": 1,
}

const HOLIDAY_VALLEY_FROM_SEC = Math.floor(Date.UTC(2026, 8, 18, 16, 0, 0) / 1000)

function isHolidayValley(bjDate: Date): boolean {
  try {
    return !!HOLIDAY_VALLEY[bjDate.toISOString().slice(0, 10)]
  } catch (_err) { return false }
}

function isPeakTime(timeSec: number): boolean {
  if (!isFinite(timeSec)) return false
  const bj = new Date(timeSec * 1000 + 8 * 3600 * 1000)
  if (timeSec >= WEEKEND_VALLEY_FROM_SEC) {
    const dow = bj.getUTCDay()
    if (dow === 0 || dow === 6) return false
  }
  if (timeSec >= HOLIDAY_VALLEY_FROM_SEC && isHolidayValley(bj)) return false
  const hour = bj.getUTCHours()
  for (const [start, end] of PEAK_HOURS) {
    if (hour >= start && hour < end) return true
  }
  return false
}

export function currentPricingMode(): "peak" | "valley" {
  return isPeakTime(Math.floor(Date.now() / 1000)) ? "peak" : "valley"
}

export interface WhaleState {
  ledger: Ledger
  summary: BalanceSummary | null
  loading: boolean
  error: string | null
  lastFetchAt: number | null
  pricingMode: "peak" | "valley"
}

function defaultLedger(): Ledger {
  return {
    date: beijingDay(),
    lastBalance: 0,
    todayUsage: 0,
    history: {},
    events: [],
    dayStart: 0,
    accounting: {
      version: ACCOUNTING_VERSION,
      active: "",
      books: {},
      migratedAt: Date.now(),
      legacyHistory: {},
    },
  }
}

function readLegacyLedger(): Ledger | null {
  try {
    if (typeof localStorage === "undefined") return null
    const raw = localStorage.getItem(LS_WHALE_LEDGER)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.accounting) return null
    return parsed as Ledger
  } catch {
    return null
  }
}

function persistLedger(ledger: Ledger) {
  try {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(LS_WHALE_LEDGER, JSON.stringify(ledger))
  } catch {
    // storage full, silently ignore
  }
}

let _pollTimer: ReturnType<typeof setInterval> | null = null

export namespace WhaleBalance {
  const initialLedger = readLegacyLedger() || defaultLedger()
  const initialDay = beijingDay()
  const initialSummary = balanceSummary(initialLedger, initialDay)

  export const store = new Store<WhaleState>({
    ledger: initialLedger,
    summary: initialSummary,
    loading: false,
    error: null,
    lastFetchAt: null,
    pricingMode: currentPricingMode(),
  })

  function getScope(apiKey: string): string {
    if (!apiKey) return "default"
    let hash = 0
    const s = String(apiKey)
    for (let i = 0; i < Math.min(s.length, 64); i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i)
      hash |= 0
    }
    return "ak_" + Math.abs(hash).toString(36).slice(0, 12)
  }

  export async function fetchBalance(apiKey: string): Promise<BalanceSummary | null> {
    if (!apiKey) {
      store.setState(s => ({ ...s, error: "未配置 API Key", loading: false }))
      return null
    }

    const state = store.state
    const now = Date.now()
    if (state.lastFetchAt && now - state.lastFetchAt < 15000) {
      return state.summary
    }

    store.setState(s => ({ ...s, loading: true, error: null }))

    try {
      const res = await fetch(BALANCE_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`余额接口返回 ${res.status}${text ? ": " + text.slice(0, 100) : ""}`)
      }

      const data = await res.json()
      const rawBalance = data?.balance_infos?.[0]?.total_balance
      const balance = Number(rawBalance)
      if (!isFinite(balance)) {
        throw new Error("余额数据格式异常，请检查 API Key 是否有效")
      }

      const snapshot = {
        at: now,
        balance,
        currency: "CNY",
        scope: getScope(apiKey),
      }

      const ledger = { ...state.ledger }
      const summary = observeBalance(ledger, snapshot)

      persistLedger(ledger)

      store.setState(s => ({
        ...s,
        ledger,
        summary,
        loading: false,
        error: null,
        lastFetchAt: now,
        pricingMode: currentPricingMode(),
      }))

      return summary
    } catch (err) {
      const message = err instanceof Error ? err.message : "余额获取失败"
      const isNetwork = message.includes("fetch") || message.includes("network") || message.includes("timeout") || message.includes("abort")
      store.setState(s => ({
        ...s,
        loading: false,
        error: isNetwork ? "网络连接失败，稍后重试" : message,
      }))
      return null
    }
  }

  export function startPolling(getApiKey: () => string) {
    stopPolling()

    const poll = () => fetchBalance(getApiKey())
    poll()
    _pollTimer = setInterval(poll, POLL_INTERVAL_MS)

    const peakCheck = setInterval(() => {
      store.setState(s => ({ ...s, pricingMode: currentPricingMode() }))
    }, 30000)

    if (_pollTimer) {
      const origTimer = _pollTimer
      _pollTimer = setInterval(() => {
        poll()
        store.setState(s => ({ ...s, pricingMode: currentPricingMode() }))
      }, POLL_INTERVAL_MS) as unknown as ReturnType<typeof setInterval>
      clearInterval(origTimer)
      setInterval(() => {}, POLL_INTERVAL_MS) // keep peakCheck alive
    }
  }

  export function stopPolling() {
    if (_pollTimer !== null) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
  }

  export function recordTurn(model: string, inputTokens: number, outputTokens: number, cacheHitTokens: number = 0) {
    const state = store.state
    const peak = isPeakTime(Math.floor(Date.now() / 1000))
    const priceIdx = peak ? 1 : 0

    const missTokens = inputTokens - cacheHitTokens
    const hitPrice = 0.02
    const missPrice = 1
    const outPrice = 4
    const multiplier = peak ? 2 : 1
    const cost = (cacheHitTokens * hitPrice + missTokens * missPrice + outputTokens * outPrice) / 1000000 * multiplier

    const event: LedgerEvent = {
      ts: Date.now(),
      day: beijingDay(),
      model,
      cost: Math.round(cost * 1e8) / 1e8,
      tokens: inputTokens + outputTokens,
    }

    const ledger = { ...state.ledger }
    ledger.events = [...(ledger.events || []), event]
    ledger.history ||= {}
    const day = event.day
    ledger.history[day] = (ledger.history[day] || 0) + event.cost
    persistLedger(ledger)

    store.setState(s => ({ ...s, ledger }))
  }
}