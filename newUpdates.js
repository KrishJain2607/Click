import React, { useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(null);

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
        })
        .then(() => {
            localStorage.removeItem("clickData");
        })
        .catch(err => console.error("Error sending click data:", err));
    };

    useEffect(() => {
        const handleClick = (event) => {
            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("en-GB");
            let timeBetweenClicks = null;

            if (lastClickTime.current) {
                const timeDiff = timestamp - lastClickTime.current;
                const dateObj = new Date(timeDiff);
                timeBetweenClicks = dateObj.toISOString().substr(11, 8);
            }
            lastClickTime.current = timestamp;
            const currentURL = window.location.href;

            const parentElement = event.target.closest("[click-id]");
            if (parentElement) {
                const clickId = parentElement.getAttribute("click-id");
                const clickedElementText = event.target.innerText.trim();

                const newClick = {
                    elementName: `Clicked: ${clickedElementText} (Parent ID: ${clickId})`,
                    currentURL,
                    previousURL: previousURL.current,
                    timestamp: formattedTime,
                    timeBetweenClicks,
                    entryURL: entryURL.current,
                    exitURL: null,
                };

                let clickData = loadClickData();
                clickData.push(newClick);
                saveClickData(clickData);
                sendDataToBackend([newClick]);
            }

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



V-02

import React, {Fragment, useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(null);

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
        })
        .then(() => {
            localStorage.removeItem("clickData");
        })
        .catch(err => console.error("Error sending click data:", err));
    };

    useEffect(() => {
        const handleClick = (event) => {
            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("en-GB");
            let timeBetweenClicks = null;

            if (lastClickTime.current) {
                const timeDiff = timestamp - lastClickTime.current;
                const dateObj = new Date(timeDiff);
                timeBetweenClicks = dateObj.toISOString().substr(11, 8);
            }
            lastClickTime.current = timestamp;
            const currentURL = window.location.href;

            const parentElement = event.target.closest("[click-id], [dropdown-id]");
            if (parentElement) {
                const clickId = parentElement.getAttribute("click-id");
                const dropdownId = parentElement.getAttribute("dropdown-id");
                const clickedElementText = event.target.innerText.trim();

                let elementName = "";
                if (clickId) {
                    elementName = `Clicked: ${clickedElementText} (Parent ID: ${clickId})`;
                } else if (dropdownId) {
                    elementName = `${dropdownId} = ${clickedElementText}`;
                }

                const newClick = {
                    elementName,
                    currentURL,
                    previousURL: previousURL.current,
                    timestamp: formattedTime,
                    timeBetweenClicks,
                    entryURL: entryURL.current,
                    exitURL: null,
                };

                let clickData = loadClickData();
                clickData.push(newClick);
                saveClickData(clickData);
                sendDataToBackend([newClick]);
            }

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

    return <Fragment>{children}</Fragment>;
};

export default ClickTrackerWrapper;

