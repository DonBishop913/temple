import streamlit as st
import pandas as pd
import plotly.express as px
import requests
import time

st.set_page_config(page_title="USIC WDA Dashboard", layout="wide")
st.title("USIC Wave Differentiation Analyst")

# Load Schumann Resonance data
def load_schumann():
    try:
        df = pd.read_csv('C:/Temple/Logs/Schumann_Resonance.csv')
        if 'timestamp' in df.columns:
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
            except Exception:
                pass
        return df
    except FileNotFoundError:
        return pd.DataFrame()
    except Exception as e:
        st.error(f"Failed to load Schumann data: {e}")
        return pd.DataFrame()

df = load_schumann()
if not df.empty:
    st.subheader("Schumann Resonance vs. Time")
    if 'frequency' in df.columns:
        fig = px.line(df, x='timestamp' if 'timestamp' in df.columns else df.index, y='frequency', title='Schumann Resonance Frequency (Hz)')
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info('No "frequency" column found in Schumann_Resonance.csv')

    st.subheader("Recent Data")
    st.dataframe(df.tail(10))

    # Basic stats
    st.subheader("Resonance Statistics")
    if 'frequency' in df.columns:
        st.write(f"Average Frequency: {df['frequency'].mean():.2f} Hz")
    if 'amplitude' in df.columns:
        st.write(f"Max Amplitude: {df['amplitude'].max():.2f}")
else:
    st.error("Schumann_Resonance.csv not found. Run wda_ingest.py to generate data.")

# Live SR Anomaly Viewer (polling bridge)
st.subheader("Live SR Anomaly Viewer")
anomaly_box = st.empty()
bridge_url = st.text_input('Socket Bridge URL', 'http://localhost:3001')

def fetch_latest_anomaly(bridge_base):
    try:
        r = requests.get(bridge_base.rstrip('/') + '/latest-anomaly', timeout=2)
        if r.status_code == 200:
            return r.json().get('anomaly')
    except Exception as e:
        return {'error': str(e)}
    return None

if bridge_url:
    # Poll every 3 seconds using Streamlit's experimental rerun mechanism
    last_seen = st.session_state.get('last_anomaly_ts', None)
    anomaly = fetch_latest_anomaly(bridge_url)
    if isinstance(anomaly, dict) and anomaly.get('error'):
        anomaly_box.error(f"Bridge error: {anomaly['error']}")
    elif anomaly:
        # Simple dedupe by timestamp
        ts = anomaly.get('timestamp') or anomaly.get('receivedAt')
        if ts != last_seen:
            st.session_state['last_anomaly_ts'] = ts
            anomaly_box.success(f"Anomaly Detected: {anomaly.get('message') or anomaly.get('label') or 'SR anomaly'} at {ts}")
    else:
        anomaly_box.info('No anomalies detected')

    # lightweight auto-refresh
    time.sleep(3)
    st.experimental_rerun()

st.subheader("Financial Correlation (Preview)")
st.write("Awaiting financial data integration for SR correlation.")
