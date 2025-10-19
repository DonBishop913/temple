# USIC WDA Streamlit Panel

This small Streamlit app visualizes Schumann Resonance samples written to `C:/Temple/Logs/Schumann_Resonance.csv`.

Run (PowerShell):

```powershell
cd C:\Temple\dashboard
python -m pip install --user -r requirements.txt
streamlit run wda_panel.py
```

Then open http://localhost:8501 in your browser.

Notes:
- The app reads `Schumann_Resonance.csv` and plots `frequency` vs `timestamp`.
- If you want server-side anomaly alerts, those are emitted from `backend_api.js` to Socket.IO (event `sr_anomaly`).
