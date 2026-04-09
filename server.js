const express = require("express");
require("dotenv").config();
const { summarizeText } = require("./llm");
const { extractJSON } = require("./utils");

const app = express();
app.use(express.json());

app.post("/summarize", async(req, res) => {
    try{
        const {text} = req.body;
        if(!text){
            return res.status(400).json({ error: "Text is required"});
        }
        const result = await summarizeText(text);
        const data = extractJSON(result);

        if(!data){
            return res.status(500).json({ error: "Failed to parse LLM response" });
        }
        res.json({ success: true, data });
    }catch(error){
        console.error(error);
        res.status(500).json({success: false, error: "Something went wrong"});
    }
})
app.listen(3000, () => {
    console.log("Server is running")
})
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});
