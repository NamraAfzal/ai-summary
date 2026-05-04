const express = require("express");
const app = express();

app.use(express.json());

let tasks = [];
app.post("/tasks",(req, res) => {
    const { title, description } = req.body;

    const newTask = {
        id: tasks.length + 1, 
        title,
        description,
    };
    tasks.push(newTask);
    res.json(newTask);
});
app.get("/tasks",(req,res) => {
    res.json(tasks);
});

app.get("/", (req, res) => {
    res.send("API is running");
});
app.listen(3000, () => {
    console.log("Server is running 3000")
})
