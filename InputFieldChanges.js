import React, { Fragment, useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL, timeInterval, Button = "on" }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(window.location.href);
    const userID = useRef(null);
    const sessionTimeoutRef = useRef(null);
    const batchTimeoutRef = useRef(null);
    const clickCounter = useRef(0);
    const lastBatchTime = useRef(new Date().getTime());
    const sessionStartTimestamp = new Date().toLocaleTimeString("en-GB");
    const scrollDepth = useRef(0);

    function generateUserID() {
        const newID = Math.random().toString(36).substr(2, 9);
        localStorage.setItem("userID", newID);
        return newID;
    }

    const loadClickData = () => {
        const storedData = localStorage.getItem("clickData");
        return storedData ? JSON.parse(storedData) : [];
    };

    const saveClickData = (data) => {
        localStorage.setItem("clickData", JSON.stringify(data));
    };

    const sendDataToBackend = async (clickData) => {
        try {
            const response = await fetch(serverURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(clickData),
            });
            if (response.ok) {
                localStorage.removeItem("clickData");
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error sending the click data: ", err);
            return false;
        }
    };

    const sendBatchData = async (isSessionEnd = false) => {
        const clickData = loadClickData();
        if (clickData.length === 0) return;

        let dataToSend = [...clickData];
        if (isSessionEnd && dataToSend.length > 0) {
            dataToSend[dataToSend.length - 1].sessionEndTime = new Date();
        }

        const sendSuccess = await sendDataToBackend(dataToSend);
        if (sendSuccess) {
            saveClickData([]);
            clickCounter.current = 0;
            lastBatchTime.current = new Date().getTime();
        } else {
            localStorage.setItem("failedBatch", JSON.stringify(dataToSend));
        }
    };

    const logInputValue = (inputElement, eventType = "blur") => {
        const inputId = inputElement.getAttribute("click-input-id");
        let inputValue;

        const textAreaField = inputElement.querySelector("textarea");
        if (textAreaField) {
            inputValue = textAreaField.value || textAreaField.innerText;
        } else {
            const inputField = inputElement.querySelector("input");
            if (inputField) {
                inputValue = inputField.value || inputField.getAttribute("value");
            } else {
                inputValue = inputElement.value || inputElement.getAttribute("value");
            }
        }

        inputValue = inputValue ? inputValue.trim() : "";

        if (inputId && inputValue) {
            const timestamp = new Date();
            const formattedTime = timestamp.toLocaleTimeString("en-GB");
            const currentURL = window.location.href;

            const newClick = {
                userID: userID.current,
                elementName: `${inputId} : ${inputValue}`,
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks: null,
                entryURL: entryURL.current,
                exitURL: null,
                sessionStartTime: sessionStartTimestamp,
                sessionEndTime: null,
                scrollDepth: `${scrollDepth.current.toFixed(2)}%`,
            };

            let clickData = loadClickData();
            clickData.push(newClick);
            saveClickData(clickData);

            clickCounter.current++;
            if (clickCounter.current >= 20) {
                sendBatchData();
            }
        }
    };

    const handleInputBlur = (event) => {
        const inputContainer = event.target.closest("[click-input-id]");
        if (inputContainer) {
            logInputValue(inputContainer, "blur");
        }
    };

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
        const parentElement = event.target.closest("[click-dd-id][click-btn-id]");
        if (parentElement) {
            const clickId = parentElement.getAttribute("click-btn-id") || "NA";
            const dropdownId = parentElement.getAttribute("click-dd-id") || "NA";
            const clickedElementText = event.target.innerText;

            let elementName =
                dropdownId !== "NA"
                    ? `${dropdownId} = ${clickedElementText}`
                    : `${clickedElementText} (Click-ID: ${clickId})`;

            const newClick = {
                userID: userID.current,
                elementName,
                currentURL,
                previousURL: previousURL.current,
                timestamp: formattedTime,
                timeBetweenClicks,
                entryURL: entryURL.current,
                exitURL: null,
                sessionStartTime: sessionStartTimestamp,
                sessionEndTime: null,
                scrollDepth: `${scrollDepth.current.toFixed(2)}%`,
            };

            let clickData = loadClickData();
            clickData.push(newClick);
            saveClickData(clickData);

            clickCounter.current++;
            if (clickCounter.current >= 20) {
                sendBatchData();
            }
        }

        const inputElement = event.target.closest("[click-input-id]");
        if (inputElement) {
            logInputValue(inputElement, "click");
        }

        if (currentURL !== previousURL.current) {
            previousURL.current = currentURL;
        }
    };

    useEffect(() => {
        if (Button === "off") return;

        const checkFailedData = async () => {
            const failedData = localStorage.getItem("failedBatch");
            if (failedData) {
                try {
                    const parsedData = JSON.parse(failedData);
                    await sendDataToBackend(parsedData);
                    localStorage.removeItem("failedBatch");
                } catch (error) {
                    console.error("Error Retrying Failed Batch Data:", error);
                }
            }
        };
        checkFailedData();
    }, [Button]);

    useEffect(() => {
        if (Button === "off") return;

        userID.current = generateUserID();

        const handleScroll = () => {
            const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            scrollDepth.current = Math.max(scrollDepth.current, scrolled);
        };

        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll);
        document.addEventListener("blur", handleInputBlur, true);

        const batchInterval = setInterval(() => {
            sendBatchData();
        }, timeInterval);

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
            document.removeEventListener("blur", handleInputBlur, true);
            clearInterval(batchInterval);

            sendBatchData(true);
        };
    }, [serverURL, Button, timeInterval]);

    return <Fragment>{children}</Fragment>;
};

export default ClickTrackerWrapper;
