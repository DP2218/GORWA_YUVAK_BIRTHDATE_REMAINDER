import streamlit as st
import pandas as pd

st.set_page_config(page_title="Yuvak Birthday Dashboard", layout="wide")

# ---------------- LOAD DATA ---------------- #
df = pd.read_excel("GORWA YUVAK BIRTHDATES.xlsx")

df.columns = df.columns.str.strip()

df = df.rename(columns={
    'Name': 'Yuvak Name',
    'Contact No': 'Contact',
    'Birth Date': 'Birthdate'
})

# Fix contact
df['Contact'] = df['Contact'].fillna(0).astype(int).astype(str)
df['Contact'] = '91' + df['Contact']

# Date clean
df['Birthdate'] = pd.to_datetime(df['Birthdate'], errors='coerce')
df = df.dropna(subset=['Birthdate'])

df['Month'] = df['Birthdate'].dt.strftime('%B')

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>🎉 Yuvak Birthday Dashboard</h1>
<p style='text-align: center; color: grey;'>Mobile Friendly • Modern UI</p>
""", unsafe_allow_html=True)

# ---------------- CSS ---------------- #
st.markdown("""
<style>

/* Remove link underline */
a {
    text-decoration: none !important;
    color: inherit !important;
}

/* Card */
.card {
    margin-bottom: 20px;
    background:#1c1c1c;
    padding:18px;
    border-radius:12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

/* Button */
.custom-btn {
    display:flex;
    justify-content:center;
    align-items:center;
    padding:12px;
    border-radius:10px;
    font-weight:600;
    color:white !important;
    width:100%;
}

/* Colors */
.call-btn { background:#2563eb; }
.wa-btn { background:#16a34a; }

/* Sticky bar */
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #111;
    padding: 10px;
    display: flex;
    gap: 10px;
    z-index: 9999;
}

/* prevent overlap */
body {
    padding-bottom: 80px;
}

</style>
""", unsafe_allow_html=True)

# ---------------- MONTH SELECT ---------------- #
month_order = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

available_months = [m for m in month_order if m in df['Month'].values]

selected_month = st.selectbox("📅 Select Month", available_months)

month_df = df[df['Month'] == selected_month].copy()
month_df['Birthdate'] = month_df['Birthdate'].dt.strftime('%d %B')

# ---------------- SELECTED PERSON ---------------- #
if "selected_contact" not in st.session_state:
    st.session_state.selected_contact = None
    st.session_state.selected_name = None

# ---------------- CARD UI ---------------- #
st.markdown("### 🎂 Birthday List")

if not month_df.empty:
    cols = st.columns(2)

    for i, (_, row) in enumerate(month_df.iterrows()):
        with cols[i % 2]:

            # Card click button
            if st.button(f"🎉 {row['Yuvak Name']}", key=i):
                st.session_state.selected_contact = row['Contact']
                st.session_state.selected_name = row['Yuvak Name']

            st.markdown(f"""
            <div class="card">
                <p>📅 {row['Birthdate']}</p>
                <p>📞 {row['Contact']}</p>
            </div>
            """, unsafe_allow_html=True)

else:
    st.info("No birthdays in this month")

# ---------------- STICKY BOTTOM BAR ---------------- #
if st.session_state.selected_contact:

    message = f"Happy Birthday {st.session_state.selected_name} 🎉🎂"

    st.markdown(f"""
    <div class="bottom-bar">

        <a href="tel:{st.session_state.selected_contact}" style="flex:1;">
            <div class="custom-btn call-btn">📞 Call</div>
        </a>

        <a href="https://wa.me/{st.session_state.selected_contact}?text={message}" style="flex:1;">
            <div class="custom-btn wa-btn">💬 WhatsApp</div>
        </a>

    </div>
    """, unsafe_allow_html=True)

# ---------------- ALL DATA ---------------- #
st.markdown("<div style='margin-top:30px;'></div>", unsafe_allow_html=True)

with st.expander("📋 View All Records"):
    all_df = df.copy()
    all_df['Birthdate'] = all_df['Birthdate'].dt.strftime('%d %B')
    st.dataframe(all_df[['Yuvak Name', 'Contact', 'Birthdate']], use_container_width=True)
