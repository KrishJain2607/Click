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
                timeBetweenClicks = new Date(timeDiff).toISOString().substr(11, 8);
            }
            lastClickTime.current = timestamp;
            const currentURL = window.location.href;

            const parentElement = event.target.closest("[click-id], [dropdown-id]");
            if (parentElement) {
                const clickId = parentElement.getAttribute("click-id");
                const dropdownId = parentElement.getAttribute("dropdown-id");
                const clickedElementText = parentElement.innerText.trim();

                let elementName = "";
                if (clickId) {
                    elementName = `Clicked: ${clickedElementText} (Parent ID: ${clickId})`;
                }
                if (dropdownId) {
                    elementName = `${dropdownId} = ${clickedElementText}`;
                }

                if (elementName) {
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


V-03


import React, {Fragment, useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(window.location.href); // Initialize properly
    const sessionStartTime = useRef(new Date().getTime());
    const scrollDepth = useRef(0);
    const userID = useRef(localStorage.getItem("userID") || Math.random().toString(36).substr(2, 9));
    localStorage.setItem("userID", userID.current);

    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    const sendDataToBackend = (clickData) => {
        saveClickData(clickData); // Ensure data is saved first
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
                const clickId = parentElement.getAttribute("click-id") || "N/A";
                const dropdownId = parentElement.getAttribute("dropdown-id") || "N/A";
                const clickedElementText = event.target.innerText.trim();

                let elementName = `Clicked: ${clickedElementText} (Click-ID: ${clickId}, Dropdown-ID: ${dropdownId})`;

                const newClick = {
                    userID: userID.current,
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

        const handleScroll = () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            scrollDepth.current = Math.max(scrollDepth.current, scrolled);
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll);

        const interval = setInterval(() => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                sendDataToBackend(clickData);
            }
        }, 10000);

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
            clearInterval(interval);
        };
    }, [serverURL]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            const sessionEndTime = new Date().getTime();
            const sessionDuration = ((sessionEndTime - sessionStartTime.current) / 1000).toFixed(2);

            let clickData = loadClickData();
            if (clickData.length > 0) {
                clickData[clickData.length - 1].exitURL = window.location.href;
            }

            const sessionData = {
                userID: userID.current,
                eventType: "Session Ended",
                sessionDuration: sessionDuration,
                exitURL: window.location.href,
                scrollDepth: `${scrollDepth.current.toFixed(2)}%`,
            };

            navigator.sendBeacon(serverURL, JSON.stringify([...clickData, sessionData]));
            localStorage.removeItem("clickData");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [serverURL]);

    useEffect(() => {
        const startSession = {
            userID: userID.current,
            eventType: "Session Started",
            sessionStartTime: new Date().toLocaleTimeString("en-GB"),
            entryURL: entryURL.current,
        };
        sendDataToBackend([startSession]);
    }, []);

    return <Fragment>{children}</Fragment>;
};

export default ClickTrackerWrapper;



V-04

import React, {Fragment, useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(window.location.href);
    const sessionStartTime = useRef(new Date().getTime());
    const scrollDepth = useRef(0);
    const userID = useRef(localStorage.getItem("userID") || Math.random().toString(36).substr(2, 9));
    localStorage.setItem("userID", userID.current);

    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    const sendDataToBackend = (clickData) => {
        saveClickData(clickData);
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
                const clickId = parentElement.getAttribute("click-id") || "N/A";
                const dropdownId = parentElement.getAttribute("dropdown-id") || "N/A";
                const clickedElementText = event.target.innerText.trim();

                let elementName = `Clicked: ${clickedElementText} (Click-ID: ${clickId}, Dropdown-ID: ${dropdownId})`;

                const newClick = {
                    userID: userID.current,
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

        const handleScroll = () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            scrollDepth.current = Math.max(scrollDepth.current, scrolled);
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll);

        const interval = setInterval(() => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                sendDataToBackend(clickData);
            }
        }, 10000);

        const sessionTimeout = setTimeout(() => {
            handleSessionEnd();
        }, 100000); // End session after 100 seconds

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
            clearInterval(interval);
            clearTimeout(sessionTimeout);
        };
    }, [serverURL]);

    const handleSessionEnd = () => {
        const sessionEndTime = new Date().getTime();
        const sessionDuration = ((sessionEndTime - sessionStartTime.current) / 1000).toFixed(2);

        let clickData = loadClickData();
        if (clickData.length > 0) {
            clickData[clickData.length - 1].exitURL = window.location.href;
        }

        const sessionData = {
            userID: userID.current,
            eventType: "Session Ended",
            sessionDuration: sessionDuration,
            exitURL: window.location.href,
            scrollDepth: `${scrollDepth.current.toFixed(2)}%`,
        };

        navigator.sendBeacon(serverURL, JSON.stringify([...clickData, sessionData]));
        localStorage.removeItem("clickData");
    };

    useEffect(() => {
        window.addEventListener("beforeunload", handleSessionEnd);
        return () => window.removeEventListener("beforeunload", handleSessionEnd);
    }, [serverURL]);

    useEffect(() => {
        const startSession = {
            userID: userID.current,
            eventType: "Session Started",
            sessionStartTime: new Date().toLocaleTimeString("en-GB"),
            entryURL: entryURL.current,
        };
        sendDataToBackend([startSession]);
    }, []);

    return <Fragment>{children}</Fragment>;
};

export default ClickTrackerWrapper;



V-05
import React, { Fragment, useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(window.location.href);
    const sessionStartTime = useRef(new Date().getTime());
    const scrollDepth = useRef(0);
    const userID = useRef(localStorage.getItem("userID") || Math.random().toString(36).substr(2, 9));
    localStorage.setItem("userID", userID.current);

    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    const sendDataToBackend = (clickData) => {
        saveClickData(clickData);
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
                const clickId = parentElement.getAttribute("click-id") || "N/A";
                const dropdownId = parentElement.getAttribute("dropdown-id") || "N/A";
                const clickedElementText = event.target.innerText.trim();

                let elementName = dropdownId !== "N/A" 
                    ? `${dropdownId} = ${clickedElementText}` 
                    : `Clicked: ${clickedElementText} (Click-ID: ${clickId})`;

                const newClick = {
                    userID: userID.current,
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

        const handleScroll = () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            scrollDepth.current = Math.max(scrollDepth.current, scrolled);
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll);

        const interval = setInterval(() => {
            let clickData = loadClickData();
            if (clickData.length > 0) {
                sendDataToBackend(clickData);
            }
        }, 10000);

        const sessionTimeout = setTimeout(() => {
            handleSessionEnd();
        }, 100000); // End session after 100 seconds

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
            clearInterval(interval);
            clearTimeout(sessionTimeout);
        };
    }, [serverURL]);

    const handleSessionEnd = () => {
        const sessionEndTime = new Date().getTime();
        const sessionDuration = ((sessionEndTime - sessionStartTime.current) / 1000).toFixed(2);

        let clickData = loadClickData();
        if (clickData.length > 0) {
            clickData[clickData.length - 1].exitURL = window.location.href;
        }

        const sessionData = {
            userID: userID.current,
            eventType: "Session Ended",
            sessionDuration: sessionDuration,
            exitURL: window.location.href,
            scrollDepth: `${scrollDepth.current.toFixed(2)}%`,
        };

        navigator.sendBeacon(serverURL, JSON.stringify([...clickData, sessionData]));
        localStorage.removeItem("clickData");
    };

    useEffect(() => {
        const startSession = {
            userID: userID.current,
            eventType: "Session Started",
            sessionStartTime: new Date().toLocaleTimeString("en-GB"),
            entryURL: entryURL.current,
        };
        sendDataToBackend([startSession]);
    }, []);

    return <Fragment>{children}</Fragment>;
};

export default ClickTrackerWrapper;

