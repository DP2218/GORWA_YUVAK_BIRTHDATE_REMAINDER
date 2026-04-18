import streamlit as st
import pandas as pd

st.set_page_config(page_title="Yuvak Birthday Dashboard", layout="wide")

# ---------------- LOAD DATA ---------------- #
df = pd.read_excel("GORWA YUVAK BIRTHDATES.xlsx")

# Clean columns
df.columns = df.columns.str.strip()

# Rename columns
df = df.rename(columns={
    'Name': 'Yuvak Name',
    'Contact No': 'Contact',
    'Birth Date': 'Birthdate'
})

# ---------------- FIX CONTACT NUMBER ---------------- #
df['Contact'] = df['Contact'].fillna(0).astype(int).astype(str)

# Optional: add country code (recommended)
df['Contact'] = '91' + df['Contact']

# ---------------- DATE CLEAN ---------------- #
df['Birthdate'] = pd.to_datetime(df['Birthdate'], errors='coerce')
df = df.dropna(subset=['Birthdate'])

df['Month'] = df['Birthdate'].dt.strftime('%B')   # ✅ fixed (removed backtick)

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>🎉 Yuvak Birthday Dashboard</h1>
<p style='text-align: center; color: grey;'>Simple • Clean • Mobile Friendly</p>
""", unsafe_allow_html=True)

# ---------------- MONTH SELECT ---------------- #
month_order = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

available_months = [m for m in month_order if m in df['Month'].values]

selected_month = st.selectbox("📅 Select Month", available_months)

month_df = df[df['Month'] == selected_month].copy()

# Format date
month_df['Birthdate'] = month_df['Birthdate'].dt.strftime('%d %B')

# ---------------- CARD UI ---------------- #
st.markdown("### 🎂 Birthday List")

if not month_df.empty:

    cols = st.columns(2)

    for i, (_, row) in enumerate(month_df.iterrows()):
        with cols[i % 2]:

            st.markdown(f"""
            <div style="
                background-color:#111;
                padding:15px;
                border-radius:12px;
                margin-bottom:15px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            ">
                <h4 style="margin:0; color:white;">🎉 {row['Yuvak Name']}</h4>
                <p style="margin:5px 0; color:#bbb;">📅 {row['Birthdate']}</p>
                <p style="margin:5px 0; color:#bbb;">📞 {row['Contact']}</p>
            </div>
            """, unsafe_allow_html=True)

            col1, col2 = st.columns(2)

            # Call button
            with col1:
                st.markdown(f"""
                <a href="tel:{row['Contact']}">
                    <button style="
                        width:100%;
                        background-color:#007BFF;
                        color:white;
                        padding:8px;
                        border:none;
                        border-radius:8px;">
                        📞 Call
                    </button>
                </a>
                """, unsafe_allow_html=True)

            # WhatsApp button
            with col2:
                message = f"Happy Birthday {row['Yuvak Name']} 🎉🎂"
                wa_url = f"https://wa.me/{row['Contact']}?text={message}"

                st.markdown(f"""
                <a href="{wa_url}">
                    <button style="
                        width:100%;
                        background-color:#25D366;
                        color:white;
                        padding:8px;
                        border:none;
                        border-radius:8px;">
                        💬 WhatsApp
                    </button>
                </a>
                """, unsafe_allow_html=True)

else:
    st.info("No birthdays in this month")
st.markdown("<br><br>", unsafe_allow_html=True)
# ---------------- ALL DATA ---------------- #
with st.expander("📋 View All Records"):
    all_df = df.copy()
    all_df['Birthdate'] = all_df['Birthdate'].dt.strftime('%d %B')
    st.dataframe(all_df[['Yuvak Name', 'Contact', 'Birthdate']], use_container_width=True)
