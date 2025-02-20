const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 1000;

app.use(cors());
app.use(bodyParser.json());

let clickDataStorage = []; // Temporary in-memory storage

app.post("/track-clickData", (req, res) => {
    const clickData = req.body;
    
    if (!Array.isArray(clickData) || clickData.length === 0) {
        return res.status(400).json({ error: "Invalid data format or empty payload" });
    }
    
    clickDataStorage.push(...clickData);
    console.log("Received Click Data:", clickData);
    
    res.status(200).json({ message: "Click data received successfully" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
