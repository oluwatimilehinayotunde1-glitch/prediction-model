import streamlit as st

# ============================================================================
# THEME — Professional Dark Dashboard (GitHub / Linear / Vercel inspired)
# ============================================================================
CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/*  Base  */
html, body, [class*="css"], .stApp, button, input, select, textarea {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    -webkit-font-smoothing: antialiased;
}
.stApp { background-color: #0B1220; color: #F8FAFC; }
.block-container { padding-top: 1.5rem; padding-bottom: 3rem; max-width: 1280px; }

/*  Top bar */

.topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px;
    background: #111827;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    margin-bottom: 20px;
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.topbar-title { font-size: 15px; font-weight: 600; color: #F8FAFC; letter-spacing: -0.01em; }
.topbar-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 500;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #CBD5E1;
}
.pill-success { color: #22C55E; background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); }
.pill-primary { color: #3B82F6; background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.2); }
.pill-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/*  Hero  */
.hero { padding: 4px 4px 20px 4px; }
.hero h1 {
    font-size: 32px; font-weight: 700; letter-spacing: -0.02em;
    color: #F8FAFC; margin: 0 0 8px 0;
}
.hero p { font-size: 15px; color: #94A3B8; margin: 0; max-width: 720px; line-height: 1.6; }

/*  Stat cards  */
.stat-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin: 20px 0 8px 0;
}
.stat-card {
    background: #1A2332;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 18px 20px;
    transition: border-color 0.15s;
}
.stat-card:hover { border-color: rgba(255,255,255,0.14); }
.stat-label { font-size: 12px; font-weight: 500; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 26px; font-weight: 700; color: #F8FAFC; margin-top: 6px; letter-spacing: -0.02em; }
.stat-sub { font-size: 12px; color: #64748B; margin-top: 4px; }

/*  Cards / containers  */
[data-testid="stVerticalBlockBorderWrapper"] {
    background: #1A2332 !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 12px !important;
    padding: 24px !important;
}

/*  Typography  */
h1, h2, h3, h4 { color: #F8FAFC !important; font-family: 'Inter', sans-serif !important; letter-spacing: -0.015em; }
h2 { font-size: 24px !important; font-weight: 600 !important; }
h3 { font-size: 18px !important; font-weight: 600 !important; }
label, p, .stMarkdown, span, div { color: #CBD5E1; }
[data-testid="stCaptionContainer"], .stCaption { color: #94A3B8 !important; font-size: 13px !important; }

.section-eyebrow {
    font-size: 11px; font-weight: 600; color: #3B82F6;
    text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
}
.section-title { font-size: 18px; font-weight: 600; color: #F8FAFC; margin-bottom: 2px; }
.section-desc { font-size: 13px; color: #94A3B8; margin-bottom: 18px; }
.group-label {
    font-size: 12px; font-weight: 600; color: #94A3B8;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin: 4px 0 10px 0; padding-bottom: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}

/*  Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 4px; background: transparent;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 0;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    color: #94A3B8 !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 10px 16px !important;
    border-radius: 8px 8px 0 0 !important;
    border: none !important;
    transition: all 0.15s;
}
.stTabs [data-baseweb="tab"]:hover { background: rgba(255,255,255,0.05) !important; color: #F8FAFC !important; }
.stTabs [aria-selected="true"] {
    background: #1E3A8A !important;
    color: #FFFFFF !important;
    font-weight: 600 !important;
}

/*  Buttons  */
.stButton > button {
    background: #2563EB !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 10px 20px !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    transition: background 0.15s !important;
    box-shadow: none !important;
}
.stButton > button:hover { background: #1D4ED8 !important; }
.stButton > button:focus { outline: 2px solid #3B82F6 !important; outline-offset: 2px !important; }

.stDownloadButton > button {
    background: transparent !important;
    color: #F8FAFC !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    border-radius: 10px !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 10px 20px !important;
}
.stDownloadButton > button:hover { background: rgba(255,255,255,0.05) !important; }

/*  Inputs  */
.stSelectbox > div > div, .stNumberInput > div > div, .stTextInput > div > div {
    background: #111827 !important;
    border: 1px solid #2B3648 !important;
    border-radius: 10px !important;
    color: #F8FAFC !important;
}
.stSelectbox > div > div:focus-within, .stNumberInput > div > div:focus-within {
    border-color: #3B82F6 !important;
}
.stSelectbox label, .stSlider label, .stNumberInput label, .stFileUploader label {
    font-size: 13px !important; font-weight: 500 !important;
    color: #CBD5E1 !important; margin-bottom: 4px !important;
}

/* Slider */
.stSlider [data-baseweb="slider"] > div > div { background: #3B82F6 !important; }
[data-testid="stTickBar"] { background: #2B3648 !important; }

/* File uploader */
[data-testid="stFileUploader"] section {
    background: #111827 !important;
    border: 1px solid #2B3648 !important;
    border-radius: 10px !important;
}
[data-testid="stFileUploader"] section:hover { border-color: #3B82F6 !important; }

/*  Alerts / dataframes  */
[data-testid="stAlert"] {
    border-radius: 10px !important;
    border: 1px solid rgba(239,68,68,0.2) !important;
    background: rgba(239,68,68,0.08) !important;
}
[data-testid="stDataFrame"] {
    border-radius: 10px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
}

/*  Result card  */
.result-card {
    border-radius: 12px;
    padding: 24px 28px;
    margin-top: 16px;
    border: 1px solid;
    display: flex; align-items: center; justify-content: space-between;
    gap: 24px;
}
.result-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    opacity: 0.85; margin-bottom: 6px;
}
.result-value { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
.result-confidence { font-size: 13px; color: #CBD5E1; margin-top: 8px; }
.result-icon {
    width: 56px; height: 56px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: 700;
    border: 1px solid; flex-shrink: 0;
}

/* Probability bars */
.prob-row { margin-bottom: 10px; }
.prob-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; color: #CBD5E1; }
.prob-bar-bg { background: #243447; height: 6px; border-radius: 3px; overflow: hidden; }
.prob-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

hr { border-color: rgba(255,255,255,0.08) !important; }

/* Remove Streamlit branding padding oddities */
footer { visibility: hidden; }
[data-testid="stDecoration"] { display: none !important; }
[data-testid="stToolbar"] { visibility: hidden !important; }
[data-testid="stHeader"] {
    background: transparent !important;
}
</style>
"""

# Performance class colors — semantic status palette
RESULT_STYLES = {
    "Excellent":    {"color": "#22C55E", "bg": "rgba(34,197,94,0.10)",  "border": "rgba(34,197,94,0.35)"},
    "Good":         {"color": "#3B82F6", "bg": "rgba(59,130,246,0.10)", "border": "rgba(59,130,246,0.35)"},
    "Satisfactory": {"color": "#F59E0B", "bg": "rgba(245,158,11,0.10)", "border": "rgba(245,158,11,0.35)"},
    "Sufficient":   {"color": "#F97316", "bg": "rgba(249,115,22,0.10)", "border": "rgba(249,115,22,0.35)"},
    "Fail":         {"color": "#EF4444", "bg": "rgba(239,68,68,0.10)",  "border": "rgba(239,68,68,0.35)"},
    "_default":     {"color": "#94A3B8", "bg": "rgba(148,163,184,0.10)","border": "rgba(148,163,184,0.35)"},
}


def apply_theme():
    """Inject the global CSS. Call once near the top of the app."""
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def top_bar(best_model_name: str):
    st.markdown(
        f"""
        <div class="topbar">
          <div class="topbar-left">
            <div class="topbar-title">Academic Performance Prediction System</div>
          </div>
          <div class="topbar-meta">
            <span class="pill pill-success"><span class="pill-dot"></span>Operational</span>
            <span class="pill pill-primary">Model · {best_model_name}</span>
            <span class="pill">v1.0</span>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def hero_and_stats(best_model_name, metrics, feature_columns, n_classes):
    best = metrics[best_model_name]
    st.markdown(
        f"""
        <div class="hero">
          <h1>Early Prediction of Academic Performance</h1>
          <p>Predict a student's academic performance using early assessment scores, attendance records and learning behaviour.</p>
        </div>
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Prediction Model</div>
            <div class="stat-value">{best_model_name}</div>
            <div class="stat-sub">Highest performing model</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">{float(best['accuracy']):.3f}</div>
            <div class="stat-sub">Evaluation dataset</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">F1 Score</div>
            <div class="stat-value">{float(best['f1_score']):.3f}</div>
            <div class="stat-sub">Model evaluation metric</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Dataset</div>
            <div class="stat-value">{len(feature_columns)} · {n_classes}</div>
            <div class="stat-sub">Inputs · output categories</div>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_result(predicted_label, proba, classes):
    style = RESULT_STYLES.get(predicted_label, RESULT_STYLES["_default"])
    confidence = None
    if proba is not None:
        idx = list(classes).index(predicted_label)
        confidence = float(proba[idx]) * 100

    conf_html = (
        f'<div class="result-confidence">Confidence · '
        f'<strong style="color:{style["color"]}">{confidence:.1f}%</strong></div>'
        if confidence is not None else ""
    )
    initial = predicted_label[0].upper()

    st.markdown(
        f"""
        <div class="result-card" style="background:{style['bg']}; border-color:{style['border']};">
          <div>
            <div class="result-label" style="color:{style['color']};">Predicted Performance</div>
            <div class="result-value" style="color:{style['color']};">{predicted_label}</div>
            {conf_html}
          </div>
          <div class="result-icon" style="color:{style['color']}; border-color:{style['border']}; background:rgba(255,255,255,0.02);">{initial}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if proba is not None:
        st.markdown('<div style="margin-top:20px;"></div>', unsafe_allow_html=True)
        st.markdown('<div class="group-label">Class Probabilities</div>', unsafe_allow_html=True)
        pairs = sorted(zip(classes, proba), key=lambda x: -x[1])
        rows_html = ""
        for cls, p in pairs:
            c = RESULT_STYLES.get(cls, RESULT_STYLES["_default"])["color"]
            pct = float(p) * 100
            rows_html += f"""
              <div class="prob-row">
                <div class="prob-head"><span>{cls}</span><span style="color:{c}; font-weight:600;">{pct:.1f}%</span></div>
                <div class="prob-bar-bg"><div class="prob-bar-fill" style="width:{pct}%; background:{c};"></div></div>
              </div>
            """
        st.markdown(rows_html, unsafe_allow_html=True)