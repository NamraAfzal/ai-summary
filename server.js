const express = require("express");
require("dotenv").config();
const { summarizeText } = require("./llm");
const { extractJSON } = require("./utils");

const app = express();
app.use(express.json());

let history = [];

app.post("/summarize", async(req, res) => {
    try{
        const {text} = req.body;
        if(!text || text.trim().length < 10){
            return res.status(400).json({ error: "Text is required and text must be at least 10 characters"});
        }
        const result = await summarizeText(text);
        const data = extractJSON(result);

        if(!data){
            return res.status(500).json({ error: "Failed to parse LLM response" });
        }
        res.json({ success: true, data });
        history.push({text, data, createdAt: new Date()});
        console.log("History length:", history.length);
    }catch(error){
        console.error(error);
        res.status(500).json({success: false, error: "Something went wrong"});
    }
})

app.delete("/history", (req, res) => {
  history = [];
  res.json({ message: "History cleared successfully" });
});

app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish",() => {
        const duration = Date.now()-start;
        console.log(`${req.method} ${req.url}-${duration}ms`);
    });
    next();
});

app.listen(3000, () => {
    console.log("Server is running")
})
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/history", (req, res) => {
  const { keyword, limit = 5, page = 1 } = req.query;

  let result = history;

  if (keyword) {
    result = result.filter(item => 
    item.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  const paginated = result.slice(startIndex, endIndex);

  res.json({
    total: result.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: paginated
  });
});
