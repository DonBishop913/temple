import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="USIC WDA Dashboard", layout="wide")
st.title("USIC Wave Differentiation Analyst")

# Load Schumann Resonance data
try:
    df = pd.read_csv('C:/Temple/Logs/Schumann_Resonance.csv')
    # Try to parse timestamp column if present
    if 'timestamp' in df.columns:
        try:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        except Exception:
            pass

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
except FileNotFoundError:
    st.error("Schumann_Resonance.csv not found. Run wda_ingest.py to generate data.")
except Exception as e:
    st.error(f"Failed to load Schumann data: {e}")

# Financial correlation (placeholder for future integration)
st.subheader("Financial Correlation (Preview)")
st.write("Awaiting financial data integration for SR correlation.")
