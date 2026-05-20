import type { Bilingual, SimTemplateId } from './types'

// Each template generates a self-contained R program (base R only — no package
// installs) that ends in an expression returning a list:
//   list(cols=<character>, series=<named list of equal-length numerics>,
//        summary=<named list of scalars>)
// webr.ts converts that to JS and into chart-ready points.

export interface ParamDef {
  key: string
  label: Bilingual
  default: number
  min?: number
  max?: number
  step?: number
}

export interface SeriesDef {
  key: string
  label: Bilingual
  axis?: 'left' | 'right'
  log?: boolean
}

export interface SimTemplate {
  id: SimTemplateId
  params: ParamDef[]
  xLabel: Bilingual
  xLog?: boolean
  series: SeriesDef[]
  generate: (p: Record<string, number>, target?: string) => string
}

const num = (x: number) => (Number.isFinite(x) ? String(x) : '0')

// Shared viral-dynamics constants (illustrative chronic set point ~2.8e4 copies/mL,
// CD4 ~350). Same block reused by viral-dynamics and pk-pd-viral.
const DYN_CONST = `lambda <- 10; d <- 0.01; beta <- 6.571e-7; delta <- 0.5; p <- 50000; cc <- 23`

function viralDynamics(p: Record<string, number>): string {
  return `sim <- function() {
  ${DYN_CONST}
  epsRT <- ${num(p.epsRT)}; epsPI <- ${num(p.epsPI)}
  days <- ${num(p.days)}; dt <- 0.1
  n <- as.integer(days / dt)
  T0 <- ${num(p.T0)}; I0 <- ${num(p.I0)}; V0 <- ${num(p.V0)}
  state <- c(${'T'}=T0, I=I0, V=V0)
  deriv <- function(s) {
    Tt <- s[1]; It <- s[2]; Vt <- s[3]
    dT <- lambda - d * Tt - (1 - epsRT) * beta * Vt * Tt
    dI <- (1 - epsRT) * beta * Vt * Tt - delta * It
    dV <- (1 - epsPI) * p * It - cc * Vt
    c(dT, dI, dV)
  }
  tt <- numeric(n + 1); V <- numeric(n + 1); CD4 <- numeric(n + 1)
  tt[1] <- 0; V[1] <- V0; CD4[1] <- T0
  for (i in 1:n) {
    k1 <- deriv(state); k2 <- deriv(state + dt / 2 * k1)
    k3 <- deriv(state + dt / 2 * k2); k4 <- deriv(state + dt * k3)
    state <- state + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    state[state < 0] <- 0
    tt[i + 1] <- i * dt; V[i + 1] <- state[3]; CD4[i + 1] <- state[1]
  }
  list(t = tt, V = V, CD4 = CD4)
}
r <- sim()
idx <- unique(round(seq(1, length(r$t), length.out = min(length(r$t), 300))))
below <- which(r$V < 50)
t2s <- if (length(below) > 0) r$t[below[1]] else -1
list(
  cols = c('t', 'V', 'CD4'),
  series = list(t = r$t[idx], V = r$V[idx], CD4 = r$CD4[idx]),
  summary = list(t2s = t2s, vl_end = tail(r$V, 1), cd4_end = tail(r$CD4, 1))
)`
}

function doseResponse(p: Record<string, number>): string {
  return `ic50 <- ${num(p.ic50)}; h <- ${num(p.hill)}; emax <- ${num(p.emax)}
cmin <- ${num(p.cmin)}; cmax <- ${num(p.cmax)}; n <- ${num(p.npts)}
conc <- 10^seq(log10(cmin), log10(cmax), length.out = n)
eff <- emax * conc^h / (ic50^h + conc^h)
list(
  cols = c('t', 'effect'),
  series = list(t = conc, effect = eff),
  summary = list(ic50 = ic50, hill = h, emax = emax)
)`
}

function pk(p: Record<string, number>): string {
  return `ka <- ${num(p.ka)}; ke <- ${num(p.ke)}; Vd <- ${num(p.vd)}
dose <- ${num(p.dose)}; tau <- ${num(p.interval)}; ndoses <- ${num(p.ndoses)}
if (abs(ka - ke) < 1e-9) ka <- ke + 1e-6
horizon <- tau * ndoses + 4 / ke
t <- seq(0, horizon, length.out = 600)
conc1 <- function(tt) {
  s <- 0
  for (j in 0:(ndoses - 1)) {
    ti <- j * tau
    if (tt >= ti) s <- s + (dose * ka) / (Vd * (ka - ke)) *
      (exp(-ke * (tt - ti)) - exp(-ka * (tt - ti)))
  }
  if (s < 0) 0 else s
}
C <- sapply(t, conc1)
list(
  cols = c('t', 'C'),
  series = list(t = t, C = C),
  summary = list(cmax = max(C), cmin = min(C[t > tau * (ndoses - 1)]), cavg = mean(C))
)`
}

function pkpdViral(p: Record<string, number>, target = 'infection'): string {
  return `sim <- function() {
  ${DYN_CONST}
  days <- ${num(p.days)}; dt <- 0.1
  emax <- ${num(p.emax)}; ic50 <- ${num(p.ic50)}; h <- ${num(p.hill)}
  target <- '${target}'
  ka <- ${num(p.ka)} * 24; ke <- ${num(p.ke)} * 24; Vd <- ${num(p.vd)}
  dose <- ${num(p.dose)}; tau <- ${num(p.interval)} / 24; ndoses <- ${num(p.ndoses)}
  if (abs(ka - ke) < 1e-9) ka <- ke + 1e-6
  conc <- function(tt) {
    s <- 0; kmax <- min(floor(tt / tau), ndoses - 1)
    if (kmax >= 0) for (j in 0:kmax) {
      ti <- j * tau
      s <- s + (dose * ka) / (Vd * (ka - ke)) *
        (exp(-ke * (tt - ti)) - exp(-ka * (tt - ti)))
    }
    if (s < 0) 0 else s
  }
  eff <- function(tt) { Ct <- conc(tt); emax * Ct^h / (ic50^h + Ct^h) }
  n <- as.integer(days / dt)
  T0 <- ${num(p.T0)}; I0 <- ${num(p.I0)}; V0 <- ${num(p.V0)}
  state <- c(${'T'}=T0, I=I0, V=V0)
  deriv <- function(s, e) {
    epsRT <- if (target == 'infection') e else 0
    epsPI <- if (target == 'production') e else 0
    Tt <- s[1]; It <- s[2]; Vt <- s[3]
    dT <- lambda - d * Tt - (1 - epsRT) * beta * Vt * Tt
    dI <- (1 - epsRT) * beta * Vt * Tt - delta * It
    dV <- (1 - epsPI) * p * It - cc * Vt
    c(dT, dI, dV)
  }
  tt <- numeric(n + 1); V <- numeric(n + 1); CD4 <- numeric(n + 1); E <- numeric(n + 1)
  tt[1] <- 0; V[1] <- V0; CD4[1] <- T0; E[1] <- eff(0)
  for (i in 1:n) {
    t0 <- (i - 1) * dt
    e1 <- eff(t0); e2 <- eff(t0 + dt / 2); e4 <- eff(t0 + dt)
    k1 <- deriv(state, e1); k2 <- deriv(state + dt / 2 * k1, e2)
    k3 <- deriv(state + dt / 2 * k2, e2); k4 <- deriv(state + dt * k3, e4)
    state <- state + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    state[state < 0] <- 0
    tt[i + 1] <- i * dt; V[i + 1] <- state[3]; CD4[i + 1] <- state[1]; E[i + 1] <- e4
  }
  list(t = tt, V = V, CD4 = CD4, E = E)
}
r <- sim()
idx <- unique(round(seq(1, length(r$t), length.out = min(length(r$t), 300))))
below <- which(r$V < 50)
t2s <- if (length(below) > 0) r$t[below[1]] else -1
list(
  cols = c('t', 'V', 'CD4', 'efficacy'),
  series = list(t = r$t[idx], V = r$V[idx], CD4 = r$CD4[idx], efficacy = r$E[idx]),
  summary = list(t2s = t2s, vl_end = tail(r$V, 1), eff_mean = mean(r$E))
)`
}

export const SIM_TEMPLATES: Record<SimTemplateId, SimTemplate> = {
  'viral-dynamics': {
    id: 'viral-dynamics',
    xLabel: { ru: 'Дни', en: 'Days' },
    series: [
      { key: 'V', label: { ru: 'Вирусная нагрузка', en: 'Viral load' }, axis: 'right', log: true },
      { key: 'CD4', label: { ru: 'CD4', en: 'CD4' }, axis: 'left' },
    ],
    params: [
      { key: 'epsRT', label: { ru: 'Эффективность блокады заражения ε_RT', en: 'Infection-block efficacy ε_RT' }, default: 0.95, min: 0, max: 0.999, step: 0.001 },
      { key: 'epsPI', label: { ru: 'Эффективность блокады производства ε_PI', en: 'Production-block efficacy ε_PI' }, default: 0.95, min: 0, max: 0.999, step: 0.001 },
      { key: 'days', label: { ru: 'Длительность (дни)', en: 'Duration (days)' }, default: 120, min: 7, max: 730, step: 1 },
      { key: 'V0', label: { ru: 'Начальная нагрузка', en: 'Initial viral load' }, default: 28250, min: 1, max: 1e7, step: 1 },
      { key: 'T0', label: { ru: 'Начальный CD4', en: 'Initial CD4' }, default: 350, min: 1, max: 1500, step: 1 },
      { key: 'I0', label: { ru: 'Заражённые клетки I0', en: 'Infected cells I0' }, default: 13, min: 0, max: 500, step: 1 },
    ],
    generate: (p) => viralDynamics(p),
  },
  'dose-response': {
    id: 'dose-response',
    xLabel: { ru: 'Концентрация (нМ)', en: 'Concentration (nM)' },
    xLog: true,
    series: [{ key: 'effect', label: { ru: 'Эффект', en: 'Effect' }, axis: 'left' }],
    params: [
      { key: 'ic50', label: { ru: 'IC50 (нМ)', en: 'IC50 (nM)' }, default: 10, min: 0.001, max: 1e5, step: 0.001 },
      { key: 'hill', label: { ru: 'Наклон Хилла', en: 'Hill slope' }, default: 1.5, min: 0.3, max: 5, step: 0.1 },
      { key: 'emax', label: { ru: 'Emax', en: 'Emax' }, default: 1, min: 0, max: 1, step: 0.01 },
      { key: 'cmin', label: { ru: 'Мин. концентрация', en: 'Min concentration' }, default: 0.01, min: 0.0001, max: 100, step: 0.01 },
      { key: 'cmax', label: { ru: 'Макс. концентрация', en: 'Max concentration' }, default: 10000, min: 1, max: 1e6, step: 1 },
      { key: 'npts', label: { ru: 'Точек', en: 'Points' }, default: 80, min: 20, max: 300, step: 1 },
    ],
    generate: (p) => doseResponse(p),
  },
  pk: {
    id: 'pk',
    xLabel: { ru: 'Время (ч)', en: 'Time (h)' },
    series: [{ key: 'C', label: { ru: 'Концентрация (мг/л)', en: 'Concentration (mg/L)' }, axis: 'left' }],
    params: [
      { key: 'dose', label: { ru: 'Доза (мг)', en: 'Dose (mg)' }, default: 50, min: 1, max: 5000, step: 1 },
      { key: 'ka', label: { ru: 'ka (1/ч)', en: 'ka (1/h)' }, default: 1.2, min: 0.05, max: 10, step: 0.05 },
      { key: 'ke', label: { ru: 'ke (1/ч)', en: 'ke (1/h)' }, default: 0.05, min: 0.001, max: 2, step: 0.001 },
      { key: 'vd', label: { ru: 'Vd (л)', en: 'Vd (L)' }, default: 17, min: 1, max: 1000, step: 1 },
      { key: 'interval', label: { ru: 'Интервал (ч)', en: 'Interval (h)' }, default: 24, min: 1, max: 168, step: 1 },
      { key: 'ndoses', label: { ru: 'Число доз', en: 'Number of doses' }, default: 7, min: 1, max: 60, step: 1 },
    ],
    generate: (p) => pk(p),
  },
  'pk-pd-viral': {
    id: 'pk-pd-viral',
    xLabel: { ru: 'Дни', en: 'Days' },
    series: [
      { key: 'V', label: { ru: 'Вирусная нагрузка', en: 'Viral load' }, axis: 'right', log: true },
      { key: 'CD4', label: { ru: 'CD4', en: 'CD4' }, axis: 'left' },
    ],
    params: [
      { key: 'dose', label: { ru: 'Доза (мг)', en: 'Dose (mg)' }, default: 50, min: 1, max: 5000, step: 1 },
      { key: 'ka', label: { ru: 'ka (1/ч)', en: 'ka (1/h)' }, default: 1.2, min: 0.05, max: 10, step: 0.05 },
      { key: 'ke', label: { ru: 'ke (1/ч)', en: 'ke (1/h)' }, default: 0.05, min: 0.001, max: 2, step: 0.001 },
      { key: 'vd', label: { ru: 'Vd (л)', en: 'Vd (L)' }, default: 17, min: 1, max: 1000, step: 1 },
      { key: 'interval', label: { ru: 'Интервал (ч)', en: 'Interval (h)' }, default: 24, min: 1, max: 336, step: 1 },
      { key: 'ndoses', label: { ru: 'Число доз', en: 'Number of doses' }, default: 120, min: 1, max: 730, step: 1 },
      { key: 'ic50', label: { ru: 'IC50 (мг/л)', en: 'IC50 (mg/L)' }, default: 0.05, min: 0.0001, max: 100, step: 0.0001 },
      { key: 'hill', label: { ru: 'Наклон Хилла', en: 'Hill slope' }, default: 1.5, min: 0.3, max: 5, step: 0.1 },
      { key: 'emax', label: { ru: 'Emax', en: 'Emax' }, default: 0.999, min: 0, max: 1, step: 0.001 },
      { key: 'days', label: { ru: 'Длительность (дни)', en: 'Duration (days)' }, default: 120, min: 7, max: 730, step: 1 },
      { key: 'V0', label: { ru: 'Начальная нагрузка', en: 'Initial viral load' }, default: 28250, min: 1, max: 1e7, step: 1 },
      { key: 'T0', label: { ru: 'Начальный CD4', en: 'Initial CD4' }, default: 350, min: 1, max: 1500, step: 1 },
      { key: 'I0', label: { ru: 'Заражённые клетки I0', en: 'Infected cells I0' }, default: 13, min: 0, max: 500, step: 1 },
    ],
    generate: (p, target) => pkpdViral(p, target),
  },
}

export function defaultParams(id: SimTemplateId): Record<string, number> {
  const out: Record<string, number> = {}
  for (const def of SIM_TEMPLATES[id].params) out[def.key] = def.default
  return out
}
