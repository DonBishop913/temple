import streamlit as st
import pandas as pd
import json
import os
import time
from datetime import datetime

st.set_page_config(page_title="Living Dashboard — Quantum & Resonance", layout="wide")

DATA_PATH = os.environ.get('LIVING_DASHBOARD_DATA', os.path.join(os.path.dirname(__file__), 'resonance_data.json'))
FEEDBACK_PATH = os.path.join(os.path.dirname(__file__), 'council_feedback.json')
REFRESH_SECONDS = int(os.environ.get('LIVING_DASHBOARD_REFRESH', '5'))


@st.cache_data(ttl=10)
def load_resonance():
    try:
        if not os.path.exists(DATA_PATH):
            return pd.DataFrame()
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Expecting a list of dicts
        df = pd.DataFrame(data)
        # Normalize timestamp column
        if 'timestamp' in df.columns:
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
            except Exception:
                pass
        return df
    except Exception as e:
        st.error(f"Could not load resonance data: {e}")
        return pd.DataFrame()


def load_feedback():
    try:
        if not os.path.exists(FEEDBACK_PATH):
            return pd.DataFrame(columns=["timestamp", "sender", "message", "priority"])
        with open(FEEDBACK_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return pd.DataFrame(data)
    except Exception:
        return pd.DataFrame(columns=["timestamp", "sender", "message", "priority"]) 


def save_feedback(entry):
    df = load_feedback()
    df = pd.concat([df, pd.DataFrame([entry])], ignore_index=True)
    # Ensure directory exists
    os.makedirs(os.path.dirname(FEEDBACK_PATH), exist_ok=True)
    df.to_json(FEEDBACK_PATH, orient='records', force_ascii=False)


st.title("Living Dashboard — Quantum & Resonance Metrics")

# Sidebar controls
with st.sidebar:
    st.header("Controls")
    refresh = st.number_input("Auto-refresh (s)", min_value=1, max_value=60, value=REFRESH_SECONDS)
    tail = st.number_input("Show latest N rows", min_value=1, max_value=1000, value=200)
    show_map = st.checkbox("Enable geospatial map if coordinates present", value=False)
    show_feedback = st.checkbox("Show council feedback table", value=True)
    st.markdown('---')
    st.subheader('Browser WebSocket')
    ws_uri = st.text_input('WS URI', value=os.environ.get('LIVING_DASH_WS_URI', 'ws://localhost:8001/ws'))
    token_input = st.text_input('JWT Token (paste or leave blank to prompt)', value=os.environ.get('LIVING_DASH_API_TOKEN', ''))
    enable_browser_ws = st.checkbox('Enable browser WS panel', value=False)

# Main layout
col1, col2 = st.columns([2, 1])

# Low-latency toggle: when enabled, reduce polling interval and use placeholders
low_latency = st.sidebar.checkbox("Low-latency mode (fast updates)", value=False)
poll_interval = max(1, int(refresh) // (4 if low_latency else 1))

df = load_resonance()

# Create placeholders for in-place updates
chart_ph = col1.empty()
overlay_ph = col1.empty()
feedback_form_ph = col1.empty()
stats_ph = col2.empty()
map_ph = col2.empty()
recent_ph = col2.empty()

def render_dashboard(df):
    # Chart
    with chart_ph.container():
        st.subheader("Resonance Over Time")
        if df.empty:
            st.info("No resonance data found. Place a JSON list of records at: {}".format(DATA_PATH))
        else:
            df_plot = df.copy()
            if 'timestamp' in df_plot.columns:
                df_plot = df_plot.sort_values('timestamp')
                df_plot = df_plot.set_index('timestamp')
            if 'resonance' in df_plot.columns:
                st.line_chart(df_plot['resonance'], use_container_width=True)
                st.write(df_plot['resonance'].describe())
            else:
                st.write("No 'resonance' column in data.")

    # Overlay sample
    with overlay_ph.container():
        st.markdown("---")
        st.subheader("Overlay Sample")
        if not df.empty and 'resonance_color' in df.columns:
            sample = df.tail(1).to_dict(orient='records')[0]
            st.json(sample)
        else:
            st.write("No overlay sample available.")

    # Feedback form (stays in the same container)
    with feedback_form_ph.container():
        st.markdown("---")
        st.subheader("Submit Council Feedback")
        with st.form("feedback_form"):
            sender = st.text_input("Your Name or Role")
            message = st.text_area("Suggestion, concern, or testimony")
            priority = st.selectbox("Priority", options=["High", "Medium", "Low"]) 
            submitted = st.form_submit_button("Submit Feedback")
            if submitted:
                entry = {
                    "timestamp": datetime.utcnow().isoformat() + 'Z',
                    "sender": sender or "anonymous",
                    "message": message,
                    "priority": priority
                }
                # Try posting to API endpoint if token provided, otherwise fall back to local save
                api_token = os.environ.get('LIVING_DASH_API_TOKEN')
                if api_token:
                    try:
                        import requests
                        headers = {'Authorization': f'Bearer {api_token}'}
                        resp = requests.post(os.environ.get('LIVING_DASH_API_URL', 'http://localhost:8001') + '/api/feedback', json=entry, headers=headers, timeout=5)
                        if resp.status_code == 200 or resp.status_code == 201:
                            st.success('Thank you! Your feedback was recorded.')
                        else:
                            st.warning('Feedback API returned: ' + str(resp.status_code) + ' — falling back to local save')
                            save_feedback(entry)
                    except Exception as e:
                        st.warning('Could not reach feedback API, falling back to local save: ' + str(e))
                        save_feedback(entry)
                else:
                    save_feedback(entry)
                    st.success("Thank you! Your feedback was added to the Council scroll (local fallback).")

    # Stats, map and recent activity
    with stats_ph.container():
        st.subheader("Quick Stats")
        if not df.empty and 'resonance' in df.columns:
            st.metric("Current Resonance", value=str(df['resonance'].iloc[-1]))
            st.metric("Mean", value=f"{df['resonance'].mean():.4f}")
            st.metric("Std Dev", value=f"{df['resonance'].std():.4f}")
        else:
            st.write("No stats available")

    with map_ph.container():
        if show_map and not df.empty and 'latitude' in df.columns and 'longitude' in df.columns:
            st.subheader("Geospatial")
            st.map(df[['latitude', 'longitude']].dropna().tail(tail))

    with recent_ph.container():
        st.markdown("---")
        st.subheader("Recent Activity")
        if not df.empty:
            st.dataframe(df.tail(tail))
        else:
            st.write("No recent activity.")

# Feedback list and prioritized view (placeholder)
fb_ph = st.container()

def render_feedback():
    if not show_feedback:
        return
    fb = load_feedback()
    with fb_ph:
        st.header("Council Feedback")
        if fb.empty:
            st.write("No feedback yet.")
        else:
            try:
                fb_sorted = fb.sort_values('timestamp', ascending=False)
                st.dataframe(fb_sorted)
                st.markdown("### High Priority")
                high = fb[fb['priority'] == 'High']
                if not high.empty:
                    st.table(high.sort_values('timestamp', ascending=False))
                else:
                    st.write("No high-priority items.")
            except Exception as e:
                st.write(f"Could not render feedback: {e}")


# Render once, then loop for placeholder updates
render_dashboard(df)
render_feedback()

# Controlled polling loop to update placeholders in-place
if low_latency:
    # In low-latency mode, poll more frequently but still yield control to Streamlit
    # Use a small loop to avoid blocking the app for long
    for _ in range(0, 3):
        time.sleep(max(1, poll_interval))
        df = load_resonance()
        render_dashboard(df)
        render_feedback()
else:
    # Single-pass update; rely on session-state guarded rerun to refresh later
    pass

# Browser-side WebSocket panel
if enable_browser_ws:
    try:
        import streamlit.components.v1 as components
        # Read HTML template and inject WS_URI and TOKEN safely
        tpl_path = os.path.join(os.path.dirname(__file__), 'components', 'ws_panel.html')
        with open(tpl_path, 'r', encoding='utf-8') as f:
            tpl = f.read()
        safe = tpl.replace('{{WS_URI}}', ws_uri).replace('{{TOKEN}}', token_input)
        components.html(safe, height=520)
    except Exception as e:
        st.error(f'Could not load WS panel: {e}')


# SSE client: embed a small JS listener that will append latest payloads into a hidden div
# Streamlit can read the hidden div via st.components.v1.html if needed for lightweight display.
try:
    import streamlit.components.v1 as components
    sse_html = f"""
    <div id='sse-status' style='display:none'></div>
    <script>
    const evtSource = new EventSource('/stream');
    evtSource.addEventListener('update', function(e) {{
        try {{
            const payload = JSON.parse(e.data);
            // Store latest payload in a hidden element so Streamlit can read it on rerun
            document.getElementById('sse-status').textContent = JSON.stringify(payload);
        }} catch(err) {{
            console.error('SSE parse error', err);
        }}
    }});
    evtSource.onerror = function(err) {{
        console.warn('SSE error', err);
        evtSource.close();
    }};
    </script>
    """
    components.html(sse_html, height=1)
except Exception:
    pass

# Browser-side WebSocket component is the recommended live update path.
WS_URI = os.environ.get('LIVING_DASH_WS_URI', 'ws://localhost:8001/ws')

# Auto refresh using st.experimental_rerun guarded by session state to avoid tight loops
if 'last_refresh' not in st.session_state:
    st.session_state['last_refresh'] = time.time()

now = time.time()
if refresh and (now - st.session_state['last_refresh'] >= int(refresh)):
    st.session_state['last_refresh'] = now
    # Call experimental_rerun safely (use getattr to avoid static analyzer attribute errors)
    try:
        rerun_fn = getattr(st, 'experimental_rerun', None)
        if callable(rerun_fn):
            rerun_fn()
    except Exception:
        # If rerun is unavailable or fails, fall back to no-op
        pass


# Footer
st.markdown("---")
st.caption(f"Data file: {DATA_PATH} — last loaded: {datetime.utcnow().isoformat()}Z")
