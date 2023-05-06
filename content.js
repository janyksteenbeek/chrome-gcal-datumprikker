function fetchCalendarEvents(token, calendarId, startDate, endDate) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true`;

    return fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    .then((response) => response.json())
    .then((data) => {
        if (!('items' in data)) return [];
        return data.items;
    })
    .catch((error) => {
        console.error("Error fetching calendar events:", error);
    });
}

async function markBusyDates() {
    const dateblocks = document.querySelectorAll(".date");
    const startDate = new Date(dateblocks[0].getAttribute("data-startdate")).toISOString();
    const endDate = new Date(dateblocks[dateblocks.length - 1].getAttribute("data-startdate")).toISOString();

    chrome.runtime.sendMessage({ type: "getAuthToken" }, async (token) => {
        console.log(token);
        const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        const calendarIds = data.items.map((item) => item.id);
        const events = (await Promise.all(calendarIds.map((calendarId) => fetchCalendarEvents(token, calendarId, startDate, endDate)))).flat();

        dateblocks.forEach((dateblock) => {
            const startDate = new Date(dateblock.getAttribute("data-startdate"));
            if (!events) return;
            const eventForDate = events.filter((event) => {
                if(event.start == undefined || event.end == undefined) return false;
                let eventStart = event.start.dateTime || event.start.date;
                let eventEnd = event.end.dateTime || event.end.date;

                try {
                    eventStart = new Date(Date.parse(eventStart));
                    eventEnd = new Date(Date.parse(eventEnd));
                    return startDate != eventEnd && eventStart <= startDate && startDate < eventEnd;
                } catch (e) {
                    console.error(e);
                    return false;
                }

                return false;
            });

            console.log(eventForDate);
            if (eventForDate.length > 0) {
                console.log(dateblock.parentNode.querySelector("[data-value=no]"));
                dateblock.parentNode.querySelector("[data-value=no]").click();
                dateblock.insertAdjacentHTML("beforeend", `<div class="dateblock__busy">${eventForDate[0].summary}</div>`);
            }
        });
    });
}

function waitForDateBlocks() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const dateBlocks = document.querySelectorAll(".dateblock");
            if (dateBlocks.length > 0) {
                clearInterval(interval);
                resolve();
            }
        }, 500);
    });
}

async function main() {
    await waitForDateBlocks();

    const style = document.createElement("style");
    style.innerHTML = `
    .dateblock__busy {
        background-color: #ff0000;
        color: #fff;
        font-size: 12px;
        padding: 2px 4px;
        margin: 1px;
        display: inline-block;
        border-radius: 4px;
    }`;
    document.head.appendChild(style);

    markBusyDates();
}

setTimeout(async () => {
    const button = document.querySelector("#nav_next");
    button.click();

    await main();
}, 500);