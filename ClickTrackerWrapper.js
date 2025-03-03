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

const ClickTrackerWrapper = ({ children, serverURL, trackedElements }) => {
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
        }).then(() => {
            localStorage.removeItem("clickData");
        }).catch(err => console.error("Error sending click data:", err));
    };

    useEffect(() => {
        const handleClick = (event) => {
            const target = event.target;
            if (!target) return;

            const elementKey = Object.keys(trackedElements).find((key) => 
                target.id === key || 
                target.className.includes(key) || 
                target.innerText.trim() === key
            );
            
            if (!elementKey) return; // Ignore clicks not in the predefined list
            
            const elementValue = trackedElements[elementKey]; // Get the mapped value
            const currentURL = window.location.href;
            const timestamp = new Date().toLocaleTimeString("en-GB");

            let timeBetweenClicks = null;
            if (lastClickTime.current) {
                const timeDiff = new Date() - lastClickTime.current;
                timeBetweenClicks = new Date(timeDiff).toISOString().substr(11, 8);
            }
            lastClickTime.current = new Date();

            const newClick = {
                elementName: elementValue, // Send mapped value instead of detected key
                currentURL,
                previousURL: previousURL.current,
                timestamp,
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
    }, [serverURL, trackedElements]);

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

