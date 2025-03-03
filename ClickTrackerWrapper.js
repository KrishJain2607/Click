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

            // 🔥 **Create new click data object immediately**
            const newClick = {
                elementName,
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks,
                entryURL: entryURL.current,
                exitURL: null, // Will be updated later
            };

            // 🔥 **Send latest click data immediately before storing**
            sendDataToBackend([newClick]);

            // Load existing click data from localStorage
            let clickData = loadClickData();
            clickData.push(newClick);
            saveClickData(clickData);

            // Update previous URL on page navigation
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


please analyze the code carefully and let me know once done we can then discuss further
OKay so for now the above code is tracking clicks wherever it is able to find target.id || target.className || target.innerText || target.placeholder. So now I want to tweak the code a bit. I have a pre existing code of the UI and I  want you to create for me a logic such that, inplace of tracking the above, I can just define a list of key-value pairs such that if and only if the clicked element is one of the key's already defined only then it will be sent to the server else it wont be sent and in that too if the key is defined it send the corresponding value to the server and not the key that has been detected. 


First just explain me your understanding about the above and let me know the approach we can take to achieve the same and then once we are through it we can code the same. Also feel free to ask me if you have any doubts or questino regarding the same  


import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types"; // For prop validation

const ClickTrackerWrapper = ({ children, serverURL, trackedElements }) => {
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

            // Extract attributes from the clicked element
            const attributes = {
                className: target.className, // Space-separated class names
                id: target.getAttribute("id"), // Use getAttribute for accurate extraction
                placeholder: target.getAttribute("placeholder"), // Use getAttribute for accurate extraction
                innerText: target.innerText.trim(), // Trim whitespace and newlines
            };

            // Check if any attribute matches a key in trackedElements
            let elementName = null;

            // Check className (split into individual class names)
            if (attributes.className) {
                const classNames = attributes.className.split(" ");
                for (const className of classNames) {
                    if (trackedElements[className]) {
                        elementName = trackedElements[className];
                        break;
                    }
                }
            }

            // Check id, placeholder, and innerText if no match found yet
            if (!elementName) {
                for (const [key, value] of Object.entries(attributes)) {
                    if (key !== "className" && trackedElements[value]) {
                        elementName = trackedElements[value];
                        break;
                    }
                }
            }

            if (!elementName) return; // Ignore clicks without a match

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

            // Create new click data object
            const newClick = {
                elementName,
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks,
                entryURL: entryURL.current,
                exitURL: null, // Will be updated later
            };

            // Send latest click data immediately before storing
            sendDataToBackend([newClick]);

            // Load existing click data from localStorage
            let clickData = loadClickData();
            clickData.push(newClick);
            saveClickData(clickData);

            // Update previous URL on page navigation
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
        }, 10000); // Send data every 10 sec

        return () => {
            document.removeEventListener("click", handleClick);
            clearInterval(interval);
        };
    }, [serverURL, trackedElements]); // Add trackedElements to dependency array

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

// Prop validation
ClickTrackerWrapper.propTypes = {
    children: PropTypes.node.isRequired,
    serverURL: PropTypes.string.isRequired,
    trackedElements: PropTypes.object.isRequired, // trackedElements is now required
};

export default ClickTrackerWrapper;
