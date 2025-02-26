import React, { useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(null);

    // Load stored click data from localStorage
    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    // Save click data to localStorage
    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    // Send data immediately to the backend
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
            const target = event.target;
            if (!target) return;

            const elementName = target.id || target.className || target.innerText || target.placeholder;
            if (!elementName) return; // Ignore clicks without a valid element name

            const currentURL = window.location.href;
            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("en-GB"); // 00:00:00 format

            let timeBetweenClicks = null;
            if (lastClickTime.current) {
                const timeDiff = timestamp - lastClickTime.current;
                const dateObj = new Date(timeDiff);
                timeBetweenClicks = dateObj.toISOString().substr(11, 8); // Format to HH:MM:SS
            }
            lastClickTime.current = timestamp;

            // Load existing click data from localStorage
            let clickData = loadClickData();

            // Save new click data immediately
            const newClick = {
                elementName,
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks,
                entryURL: entryURL.current,
                exitURL: null, // Will be updated later
            };

            clickData.push(newClick);
            saveClickData(clickData);

            // 🔥 **Send the latest click data immediately**
            sendDataToBackend([newClick]);

            // Update previous URL on page navigation
            if (currentURL !== previousURL.current) {
                previousURL.current = currentURL;
            }

            // Send stored data in case threshold is met
            if (clickData.length >= 50) {
                sendDataToBackend(clickData);
            }
        };

        document.addEventListener("click", handleClick);

        const interval = setInterval(() => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                sendDataToBackend(clickData);
            }
        }, 10000); // Send data every 10 sec

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
                localStorage.removeItem("clickData"); // Clear localStorage after sending
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [serverURL]);

    return <>{children}</>;
};

export default ClickTrackerWrapper;
