const { App } = require("@slack/bolt");
require("dotenv").config();
const axios = require("axios");
const { Parser } = require("json2csv");
const fs = require("fs");
const BaseUrl = "http://localhost:3000"

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,

    socketMode: false,
});

app.event("app_mention", async ({ event, say }) => {
    try {
        const userTextRaw = event.text.replace(/<@[^>]+>/, "").trim();
        const userText = userTextRaw.toLowerCase();
        const cleanedText = userText.replace("show","").replace("history","").trim();
        const match = cleanedText.match(/\d+/);
        const limit = match ? parseInt(match[0]) : 5;
        const keyword = cleanedText.replace(/\d+/,"").trim();

        const response = await axios.get(`${BaseUrl}/history`,{
                params: {
                    keyword: keyword || undefined,
                    limit
                }
            });
        const history = response.data.data;

        if(userText.startsWith("history") || userText.includes("show history")) {
            console.log("History requested");

            if(!history || history.length === 0){
                return await say("No history found");
            }


            const formatted = history.map((item, index)=> `*${index + 1}.*${item.data?.summary}`).join("\n");
            return await say(`*Recent History:*\n${formatted}`);
        }

        else if (userText.includes("clear data")) {
          await axios.delete(`${BaseUrl}/history`);
          return await say(" History cleared successfully");
        }
        else if (userText.includes("export history")) {
            console.log("Export history requested");
        
        
            if (!history || history.length === 0) {
                return await say("No history to export");
            }
        
            const formattedData = history.map(item => ({
                text: item.text,
                summary: item.data?.summary,
                actions: item.data?.action_items
                    ?.map(a => `${a.task} (${a.owner || "N/A"} - ${a.deadline || "N/A"})`)
                    .join("; "),
                createdAt: item.createdAt
            }));
        
            const parser = new Parser();
            const csv = parser.parse(formattedData);
        
            const filePath = "./history.csv";
            fs.writeFileSync(filePath, csv);
        
            await app.client.files.uploadV2({
                channel_id: event.channel,
                file: fs.createReadStream(filePath),
                filename: "history.csv",
                title: " History Export"
            });
        
            return;
        }
        } catch (error) {
        console.error(error);
        await say("Something went wrong while summarizing,");
    }
});

app.event("message", async ({ event, say }) => {
    try{
        if (event.bot_id) return;
        if (event.subtype) return;
        const text = event.text?.trim();

        if (text.toLowerCase().includes("history") || text.toLowerCase().includes("export")){
            return;
        }
        const response = await axios.post(`${BaseUrl}/summarize`,{ text
        });
        const data = response.data.data;
        await say(`*Auto Summary:* ${data.summary}
            *acation Items:*
            ${data.action_items.map(item =>
                `*${item.task} (${item.owner || "N/A"}-${item.deadline || "N/A"})`).join("\n")}`);
        }catch (error) {
            console.error(error);
        }    
});

(async () => {
    await app.start(4000);
    console.log("Slack bot is running on the port 4000");
})();
