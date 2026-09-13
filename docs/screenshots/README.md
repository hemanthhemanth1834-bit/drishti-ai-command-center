# docs/screenshots — real captures only

No fabricated screenshots are committed here.

## How to contribute a screenshot

1. Run the app locally (`npm run dev` + backend) or open the live site.
2. With Microsoft Edge or Chrome, capture the real route:

```powershell
msedge --headless --screenshot=docs/screenshots/welcome.png --window-size=1280,800 https://drishti-ai-command-center.vercel.app/welcome
```

3. Canonical set (1280×800, keep each file under ~500 KB) — matches the README gallery:

- `welcome.png` — `/welcome`
- `command.png` — `/command` (include AI panel)
- `twin.png` — `/twin`
- `drones.png` — `/drones` (after TARGET DETECTED appears, ~7s)
- `simulation.png` — `/simulation` (T+12h or T+24h active)
- `resources.png` — `/resources`
- `shelter.png` — `/shelter`
- `report.png` — `/report`
- `recovery.png` — `/recovery`
- `ops.png` — `/ops`
- `location.png` — `/location`
- `safety.png` — `/safety`
- `demo.png` — `/demo` with a scenario running

4. Reference captures from the main README's screenshot grid once added.
