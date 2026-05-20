// WebR smoke test: runs the viral-dynamics model (same R as the app) in Node
// to confirm the engine loads and the RK4 simulation behaves sensibly.
import { WebR } from 'webr'

const code = `sim <- function() {
  lambda <- 10; d <- 0.01; beta <- 6.571e-7; delta <- 0.5; p <- 50000; cc <- 23
  epsRT <- 0.95; epsPI <- 0.95
  days <- 120; dt <- 0.1
  n <- as.integer(days / dt)
  T0 <- 350; I0 <- 13; V0 <- 28250
  state <- c(T=T0, I=I0, V=V0)
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
below <- which(r$V < 50)
t2s <- if (length(below) > 0) r$t[below[1]] else -1
list(t2s = t2s, vl_start = r$V[1], vl_end = tail(r$V, 1), cd4_end = tail(r$CD4, 1))`

const webR = new WebR()
await webR.init()
const obj = await webR.evalR(code)
const js = await obj.toJs()
const out = {}
js.names.forEach((nm, i) => {
  out[nm] = js.values[i].values[0]
})
console.log('viral-dynamics result:', out)
const ok = out.vl_end < out.vl_start && out.t2s > 0
console.log(ok ? 'SMOKE OK: viral load suppressed, time-to-suppression reached' : 'SMOKE WARN: unexpected dynamics')
await webR.close()
process.exit(ok ? 0 : 1)
