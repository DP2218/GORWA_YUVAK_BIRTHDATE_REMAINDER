import streamlit as st
import pandas as pd
import calendar
from datetime import datetime

st.set_page_config(page_title="Yuvak Calendar", layout="wide")

# ---------------- LOAD DATA ---------------- #
df = pd.read_excel("GORWA YUVAK BIRTHDATES.xlsx")

df.columns = df.columns.str.strip()

df = df.rename(columns={
    'Name': 'Yuvak Name',
    'Contact No': 'Contact',
    'Birth Date': 'Birthdate'
})

df['Birthdate'] = pd.to_datetime(df['Birthdate'], errors='coerce')
df = df.dropna(subset=['Birthdate'])

df['Month'] = df['Birthdate'].dt.strftime('%B')
df['Day'] = df['Birthdate'].dt.day

today = datetime.now()

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>📅 Yuvak Birthday Calendar</h1>
""", unsafe_allow_html=True)

# ---------------- MONTH SELECT ---------------- #
month_order = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
]

selected_month = st.selectbox(
    "📅 Select Month",
    ["Select Month"] + month_order
)

# ---------------- CSS ---------------- #
st.markdown("""
<style>
.calendar {
    display:grid;
    grid-template-columns: repeat(7, 1fr);
    gap:10px;
    text-align:center;
}

.day-header {
    font-weight:bold;
    color:#aaa;
}

.day {
    padding:15px;
    border-radius:10px;
    background:#1a1a1a;
}

.birthday {
    background:#2563eb;
    color:white;
    font-weight:bold;
}

.today {
    background:#16a34a;
    color:white;
    font-weight:bold;
}
</style>
""", unsafe_allow_html=True)

# ---------------- SHOW CALENDAR ---------------- #
if selected_month != "Select Month":

    st.markdown(f"### {selected_month}, {today.year}")

    month_number = month_order.index(selected_month) + 1

    cal = calendar.monthcalendar(today.year, month_number)

    # Birthday days
    birthday_days = df[df['Month'] == selected_month]['Day'].tolist()

    # Weekday headers
    headers = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    st.markdown('<div class="calendar">', unsafe_allow_html=True)

    # Header row
    for h in headers:
        st.markdown(f'<div class="day-header">{h}</div>', unsafe_allow_html=True)

    # Days
    for week in cal:
        for day in week:
            if day == 0:
                st.markdown('<div></div>', unsafe_allow_html=True)
            else:
                # Highlight logic
                if day == today.day and selected_month == today.strftime('%B'):
                    cls = "day today"
                elif day in birthday_days:
                    cls = "day birthday"
                else:
                    cls = "day"

                st.markdown(f'<div class="{cls}">{day}</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

else:
    st.warning("👆 Please select a month")
