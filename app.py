import streamlit as st
import pandas as pd
from datetime import datetime, timedelta

st.set_page_config(page_title="Yuvak Birthday Dashboard", layout="wide")

# ---------------- LOAD DATA ---------------- #
df = pd.read_excel("GORWA YUVAK BIRTHDATES.xlsx")

df.columns = df.columns.str.strip()

df = df.rename(columns={
    'Name': 'Yuvak Name',
    'Contact No': 'Contact',
    'Birth Date': 'Birthdate'
})

# ---------------- FIX CONTACT NUMBER ---------------- #
df['Contact'] = df['Contact'].fillna(0).astype(int).astype(str)
df['Contact'] = '91' + df['Contact']

# ---------------- DATE CLEAN ---------------- #
df['Birthdate'] = pd.to_datetime(df['Birthdate'], errors='coerce')
df = df.dropna(subset=['Birthdate'])

df['Month'] = df['Birthdate'].dt.strftime('%B')
df['Day'] = df['Birthdate'].dt.day

today = datetime.now()

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>🎉 Yuvak Birthday Dashboard</h1>
<p style='text-align: center; color: grey;'>Simple • Clean • Mobile Friendly</p>
""", unsafe_allow_html=True)

# ---------------- CSS ---------------- #
st.markdown("""
<style>
a, a:link, a:visited, a:hover, a:active {
    text-decoration: none !important;
    color: inherit !important;
}
.block-container { padding-top: 2rem; padding-bottom: 2rem; }
.card {
    margin-bottom: 20px;
    background:#1a1a1a;
    padding:18px;
    border-radius:12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.custom-btn {
    display:flex;
    justify-content:center;
    align-items:center;
    padding:12px;
    border-radius:10px;
    font-weight:600;
    width:100%;
    color:white !important;
}
.call-btn { background:#2563eb; }
.wa-btn { background:#16a34a; }
.custom-btn:hover { opacity:0.9; }
</style>
""", unsafe_allow_html=True)

# ---------------- UPCOMING SECTION ---------------- #
st.markdown("### 📆 Upcoming Birthdays (Next 7 Days)")

upcoming_list = []

for i in range(7):
    future = today + timedelta(days=i)
    temp = df[
        (df['Day'] == future.day) &
        (df['Month'] == future.strftime('%B'))
    ]
    upcoming_list.append(temp)

upcoming_df = pd.concat(upcoming_list) if upcoming_list else pd.DataFrame()

if not upcoming_df.empty:
    upcoming_df['Birthdate'] = upcoming_df['Birthdate'].dt.strftime('%d %B')

    cols = st.columns(2)

    for i, (_, row) in enumerate(upcoming_df.iterrows()):
        with cols[i % 2]:
            st.markdown(f"""
            <div class="card">
                <h4>🎉 {row['Yuvak Name']}</h4>
                <p>📅 {row['Birthdate']}</p>
                <p>📞 {row['Contact']}</p>
            </div>
            """, unsafe_allow_html=True)
else:
    st.info("No upcoming birthdays")

# ---------------- MONTH SELECT ---------------- #
month_order = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

available_months = [m for m in month_order if m in df['Month'].values]

selected_month = st.selectbox(
    "📅 Select Month",
    ["Select Month"] + available_months
)

# ---------------- MONTH DATA ---------------- #
if selected_month != "Select Month":

    month_df = df[df['Month'] == selected_month].copy()
    month_df['Birthdate'] = month_df['Birthdate'].dt.strftime('%d %B')

    st.markdown("### 🎂 Birthday List")

    if not month_df.empty:

        cols = st.columns(2, gap="large")

        for i, (_, row) in enumerate(month_df.iterrows()):
            with cols[i % 2]:

                st.markdown(f"""
                <div class="card">
                    <h4>🎉 {row['Yuvak Name']}</h4>
                    <p>📅 {row['Birthdate']}</p>
                    <p>📞 {row['Contact']}</p>
                </div>
                """, unsafe_allow_html=True)

                col1, col2 = st.columns(2)

                with col1:
                    st.markdown(f"""
                    <a href="tel:{row['Contact']}">
                        <div class="custom-btn call-btn">📞 Call</div>
                    </a>
                    """, unsafe_allow_html=True)

                with col2:
                    msg = f"Happy Birthday {row['Yuvak Name']} 🎉🎂"
                    wa = f"https://wa.me/{row['Contact']}?text={msg}"

                    st.markdown(f"""
                    <a href="{wa}">
                        <div class="custom-btn wa-btn">💬 WhatsApp</div>
                    </a>
                    """, unsafe_allow_html=True)

    else:
        st.info("No birthdays in this month")

else:
    st.warning("📅 Please select a month")

# ---------------- ALL DATA ---------------- #
st.markdown("<div style='margin-top:30px;'></div>", unsafe_allow_html=True)

with st.expander("📋 View All Records"):
    all_df = df.copy()
    all_df['Birthdate'] = all_df['Birthdate'].dt.strftime('%d %B')
    st.dataframe(all_df[['Yuvak Name', 'Contact', 'Birthdate']], use_container_width=True)
