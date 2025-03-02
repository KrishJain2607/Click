import React, { useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(null);

    // 🔥 Define an empty mapping object (to be manually updated with key-value pairs)
    const clickMapping = {
        // Example: "submit-btn": "Submit Order",
        // "cancel-btn": "Cancel Order"
    };

    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    const sendDataToBackend = (clickData) => {
        fetch(serverURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clickData),
        }).then(() => {
            localStorage.removeItem("clickData"); // Clear after sending
        }).catch(err => console.error("Error sending click data:", err));
    };

    useEffect(() => {
        const handleClick = (event) => {
            const elementId = event.target.id; // Only check `id` for now
            if (!elementId || !clickMapping[elementId]) return; // Ignore if not in `clickMapping`

            const currentURL = window.location.href;
            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("en-GB"); // 00:00:00 format

            let timeBetweenClicks = null;
            if (lastClickTime.current) {
                const timeDiff = timestamp - lastClickTime.current;
                const dateObj = new Date(timeDiff);
                timeBetweenClicks = dateObj.toISOString().substr(11, 8);
            }
            lastClickTime.current = timestamp;

            // 🔥 **Use the mapped value instead of the element's ID**
            const newClick = {
                elementClicked: clickMapping[elementId], // Send mapped value
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks,
                entryURL: entryURL.current,
                exitURL: null,
            };

            sendDataToBackend([newClick]);

            let clickData = loadClickData();
            clickData.push(newClick);
            saveClickData(clickData);

            if (currentURL !== previousURL.current) {
                previousURL.current = currentURL;
            }
        };

        document.addEventListener("click", handleClick);

        const interval = setInterval(() => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                sendDataToBackend(clickData);
            }
        }, 10000);

        return () => {
            document.removeEventListener("click", handleClick);
            clearInterval(interval);
        };
    }, [serverURL]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                clickData[clickData.length - 1].exitURL = window.location.href;
                navigator.sendBeacon(serverURL, JSON.stringify(clickData));
                localStorage.removeItem("clickData");
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [serverURL]);

    return <>{children}</>;
};

export default ClickTrackerWrapper;
