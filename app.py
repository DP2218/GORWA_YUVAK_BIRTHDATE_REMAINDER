import streamlit as st
import pandas as pd
from datetime import datetime
import calendar

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

# Clean date
df['Birthdate'] = pd.to_datetime(df['Birthdate'], errors='coerce')
df = df.dropna(subset=['Birthdate'])

df['Month'] = df['Birthdate'].dt.strftime('%B')

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>🎉 Yuvak Birthday Dashboard</h1>
<p style='text-align: center; color: grey;'>Modern Calendar View</p>
""", unsafe_allow_html=True)

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

# ---------------- MAIN ---------------- #
if selected_month != "Select Month":

    year = 2026
    month_number = month_order.index(selected_month) + 1

    st.markdown(f"## 📅 {selected_month} {year}")

    cal = calendar.monthcalendar(year, month_number)

    # Prepare birthday dictionary
    bday_dict = {}
    for _, row in df[df['Month'] == selected_month].iterrows():
        day = row['Birthdate'].day
        name = row['Yuvak Name']
        if day not in bday_dict:
            bday_dict[day] = []
        bday_dict[day].append(name)

    # Week header (like Google Calendar)
    week_days = ["S", "M", "T", "W", "T", "F", "S"]
    cols = st.columns(7)
    for i, day in enumerate(week_days):
        cols[i].markdown(f"<center><b>{day}</b></center>", unsafe_allow_html=True)

    # Calendar UI
    for week in cal:
        cols = st.columns(7)
        for i, day in enumerate(week):

            if day == 0:
                cols[i].markdown(" ")

            else:
                if day in bday_dict:
                    names = ", ".join(bday_dict[day])
                    cols[i].markdown(f"""
                    <div style="
                        background:#2563eb;
                        color:white;
                        padding:12px;
                        border-radius:50%;
                        text-align:center;
                        height:60px;
                        width:60px;
                        margin:auto;
                        font-weight:bold;">
                        {day}
                    </div>
                    <center style="font-size:12px;">🎂</center>
                    """, unsafe_allow_html=True)

                    # Show names below
                    for n in bday_dict[day]:
                        cols[i].markdown(
                            f"<center style='font-size:10px;'>{n}</center>",
                            unsafe_allow_html=True
                        )

                else:
                    cols[i].markdown(f"""
                    <div style="
                        background:#1f2937;
                        color:white;
                        padding:12px;
                        border-radius:50%;
                        text-align:center;
                        height:60px;
                        width:60px;
                        margin:auto;">
                        {day}
                    </div>
                    """, unsafe_allow_html=True)

# ---------------- ALL DATA ---------------- #
st.markdown("<br>", unsafe_allow_html=True)

with st.expander("📋 View All Records"):
    all_df = df.copy()
    all_df['Birthdate'] = all_df['Birthdate'].dt.strftime('%d %B')
    st.dataframe(all_df[['Yuvak Name', 'Contact', 'Birthdate']], use_container_width=True)
