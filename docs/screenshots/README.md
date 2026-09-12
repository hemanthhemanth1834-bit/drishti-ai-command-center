# docs/screenshots — real captures only

No fabricated screenshots are committed here.

## How to contribute a screenshot

1. Run the app locally (`npm run dev` + backend) or open the live site.
2. With Microsoft Edge or Chrome, capture the real route:

```powershell
msedge --headless --screenshot=docs/screenshots/welcome.png --window-size=1280,800 https://drishti-ai-command-center.vercel.app/welcome
```

3. Suggested set (1280×800, keep each file under ~500 KB):

- `welcome.png` — `/welcome`
- `demo.png` — `/demo` with a scenario running
- `safety.png` — `/safety`
- `command.png` — `/command`
- `twin.png` — `/twin`
- `drones.png` — `/drones`
- `ops.png` — `/ops`
- `location.png` — `/location`

4. Reference captures from the main README's screenshot grid once added.
