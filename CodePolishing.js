import React, { useEffect, useRef } from "react";

const ClickTrackerWrapper = ({ children, serverURL, timeInterval, trackingEnabled = true }) => {
    const lastClickTime = useRef(null);
    const entryURL = useRef(window.location.href);
    const previousURL = useRef(window.location.href);
    const scrollDepth = useRef(0);
    const sessionStartTimestamp = new Date().toLocaleTimeString("en-GB");
    const observerMap = useRef(new Map());

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
        } else {
            localStorage.setItem("failedBatch", JSON.stringify(dataToSend));
        }
    };

    const logClick = ({ elementName, timeBetweenClicks }) => {
        const timestamp = new Date();
        const formattedTime = timestamp.toLocaleTimeString("en-GB");
        const currentURL = window.location.href;

        const newClick = {
            userID: null,
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

        const clickData = loadClickData();
        clickData.push(newClick);
        saveClickData(clickData);
    };

    const logInputValue = (inputElement) => {
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
            logClick({
                elementName: `${inputId} : ${inputValue}`,
                timeBetweenClicks: null,
            });
        }
    };

    const monitorDropdownChanges = () => {
        const dropdowns = document.querySelectorAll("[click-dd-id]");

        dropdowns.forEach((ddElement) => {
            const ddId = ddElement.getAttribute("click-dd-id");
            if (!ddId) return;

            const valueContainer = ddElement.querySelector('[class*="singleValue"]');
            if (!valueContainer) return;

            let lastValue = valueContainer.textContent?.trim();

            const observer = new MutationObserver(() => {
                const newValue = valueContainer.textContent?.trim();
                if (newValue && newValue !== lastValue) {
                    lastValue = newValue;
                    logClick({
                        elementName: `${ddId} = ${newValue}`,
                        timeBetweenClicks: null,
                    });
                }
            });

            observer.observe(valueContainer, {
                childList: true,
                subtree: true,
                characterData: true,
            });

            observerMap.current.set(ddId, observer);
        });
    };

    const handleInputBlur = (event) => {
        const inputContainer = event.target.closest("[click-input-id]");
        if (inputContainer) {
            logInputValue(inputContainer);
        }
    };

    const handleClick = (event) => {
        const timestamp = new Date();
        let timeBetweenClicks = null;

        if (lastClickTime.current) {
            const timeDiff = timestamp - lastClickTime.current;
            const dateObj = new Date(timeDiff);
            timeBetweenClicks = dateObj.toISOString().substr(11, 8);
        }
        lastClickTime.current = timestamp;

        const currentURL = window.location.href;
        if (currentURL !== previousURL.current) {
            previousURL.current = currentURL;
        }

        const btnElement = event.target.closest("[click-btn-id]");
        if (btnElement) {
            const clickId = btnElement.getAttribute("click-btn-id");
            const clickedElementText = event.target.innerText || btnElement.innerText;
            logClick({
                elementName: `${clickedElementText} (Click-ID: ${clickId})`,
                timeBetweenClicks,
            });
        }

        const inputElement = event.target.closest("[click-input-id]");
        if (inputElement) {
            logInputValue(inputElement);
        }
    };

    useEffect(() => {
        if (!trackingEnabled) return;

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
    }, [trackingEnabled]);

    useEffect(() => {
        if (!trackingEnabled) return;

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

        monitorDropdownChanges();

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
            document.removeEventListener("blur", handleInputBlur, true);
            clearInterval(batchInterval);
            sendBatchData(true);

            observerMap.current.forEach((entry) => {
                if (entry && typeof entry.disconnect === "function") entry.disconnect();
            });
        };
    }, [serverURL, trackingEnabled, timeInterval]);

    return <>{children}</>;
};

export default ClickTrackerWrapper;
