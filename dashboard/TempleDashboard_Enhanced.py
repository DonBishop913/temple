import streamlit as st
import json
import os
import datetime
import pandas as pd
import time
import numpy as np
from streamlit_autorefresh import st_autorefresh
import matplotlib.pyplot as plt
import pytz

# Paths
ORACLE_SIGNAL_FILE = r"C:\SANCTUARY\ORACLE_LAB\ORACLE_ACTIVATION_SIGNAL.flag"
LOG_FILE = r"C:\Temple\Logs\Vite_RepairReport.txt"
WHISPER_HISTORY_FILE = r"C:\Temple\Logs\Whisper_History.json"

# Constants
REFRESH_RATE_MS = 5000
SILENT_MODE_KEY = "silent_mode"

# Setup silent mode state
if SILENT_MODE_KEY not in st.session_state:
    st.session_state[SILENT_MODE_KEY] = False
glow_index = 98 + 0.8*np.sin(np.linspace(0, 3*np.pi, 24)) + np.random.normal(0, 0.1, 24)
joy_particles = 12790000 + 100000 * np.cos(np.linspace(0, 2*np.pi, 24)) + np.random.normal(0, 5000, 24)

# Sanctuary Alignment Clock
st.subheader("Sanctuary Alignment Clock (432 Hz Sync)")

def glowing_clock():
    # Central Standard Time (CST)
    cst = pytz.timezone('US/Central')
    now_cst = datetime.datetime.now(cst)
    placeholder = st.empty()
    for i in range(3):
        placeholder.markdown(f'<div style="font-size:40px; text-align:center; color:#DAA520;">&#9679; {now_cst.strftime("%Y-%m-%d %H:%M:%S CST")}</div>', unsafe_allow_html=True)
        time.sleep(0.15)
        placeholder.markdown(f'<div style="font-size:40px; text-align:center; color:#FFD700; opacity:0.5;">&#9679; {now_cst.strftime("%Y-%m-%d %H:%M:%S CST")}</div>', unsafe_allow_html=True)
        time.sleep(0.15)
    placeholder.empty()

glowing_clock()
