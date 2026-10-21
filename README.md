# Long Trust Lab

**[longtrustlab.com](https://longtrustlab.com)**

A browser-based simulator for an irrevocable multi-generation "pot" trust that pays all living descendants each year, with shares weighted by generation or age.

It runs thousands of simulated families and market histories and shows how the trust and each generation's payouts could turn out. Return models: Monte Carlo, Layered (eras, crises, slow volatility shifts and disasters), Simple, and Historical (US S&P 500, 1928–2023).

**Use it:** visit [longtrustlab.com](https://longtrustlab.com), or open `index.html` in a browser.

Everything runs in your browser. No data is sent anywhere.

**Solve & sensitivity.** "Solve for a goal" finds the highest payout rate, highest fixed payout or lowest funding that meets a goal (for example, a 90% chance of keeping the trust's real value at year 100, or a target payout for a generation). "What matters most" is a tornado chart showing how much each setting moves a chosen result.

## Development

The whole app is `index.html`; there is no build step. The simulation code sits between the `//SIM` and `//ENDSIM` markers in that file. The page hands that block to a Web Worker, and the tests load the same block in Node.

```
npm test                # needs Node 18 or later, no dependencies
npm run update-golden   # after a deliberate model change: refresh test/golden.json, then review the diff
```

- `test/sim.test.js` checks results that can be worked out by hand (for example, a 2% payout with no growth leaves 0.98^t of the trust), plus the solver and the sensitivity chart.
- `test/golden.test.js` compares key results for 17 setting combinations against `test/golden.json`, so any change to the numbers is caught.

When releasing, bump `APP_VERSION` and `APP_BUILT` together with the version comment at the top of `index.html` (a test checks that they match).

A modeling tool, not financial, tax or legal advice. Results are simulations under stated assumptions, not predictions. Confirm any plan with an estate attorney and tax advisor.

© 2026 Meeks. Released under the MIT License (see `LICENSE`).
