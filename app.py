import streamlit as st
import pandas as pd
import calendar
from datetime import datetime

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
df['Day'] = df['Birthdate'].dt.day

today = datetime.now()

# ---------------- HEADER ---------------- #
st.markdown("""
<h1 style='text-align: center;'>📅 Yuvak Birthday Calendar</h1>
<p style='text-align: center; color: grey;'>Google Calendar Style View</p>
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

/* Calendar grid */
.calendar {
    display:grid;
    grid-template-columns: repeat(7, 1fr);
    gap:10px;
    text-align:center;
}

/* Header */
.day-header {
    font-weight:bold;
    color:#aaa;
}

/* Day box */
.day {
    min-height:80px;
    padding:10px;
    border-radius:10px;
    background:#1a1a1a;
    position:relative;
}

/* Birthday highlight */
.birthday {
    background:#2563eb;
    color:white;
}

/* Today highlight */
.today {
    background:#16a34a;
    color:white;
}

/* Date number */
.date-num {
    font-weight:bold;
}

/* Name inside cell */
.name {
    font-size:12px;
    margin-top:5px;
}

</style>
""", unsafe_allow_html=True)

# ---------------- CALENDAR ---------------- #
if selected_month != "Select Month":

    year = today.year
    month_number = month_order.index(selected_month) + 1

    st.markdown(f"### {selected_month}, {year}")

    cal = calendar.monthcalendar(year, month_number)

    # Get birthdays for selected month
    month_data = df[df['Month'] == selected_month]

    birthday_dict = {}
    for _, row in month_data.iterrows():
        birthday_dict.setdefault(row['Day'], []).append(row['Yuvak Name'])

    headers = ["Su","Mo","Tu","We","Th","Fr","Sa"]

    st.markdown('<div class="calendar">', unsafe_allow_html=True)

    # Weekday headers
    for h in headers:
        st.markdown(f'<div class="day-header">{h}</div>', unsafe_allow_html=True)

    # Calendar days
    for week in cal:
        for day in week:
            if day == 0:
                st.markdown('<div></div>', unsafe_allow_html=True)
            else:
                names = birthday_dict.get(day, [])

                # Highlight logic
                if day == today.day and selected_month == today.strftime('%B'):
                    cls = "day today"
                elif day in birthday_dict:
                    cls = "day birthday"
                else:
                    cls = "day"

                # Show names inside cell
                name_html = ""
                for n in names[:2]:  # limit names
                    name_html += f'<div class="name">🎉 {n}</div>'

                st.markdown(f"""
                <div class="{cls}">
                    <div class="date-num">{day}</div>
                    {name_html}
                </div>
                """, unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

else:
    st.warning("👆 Please select a month")
