const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function summarizeText(text) {
  const prompt = `
You are an assistant that extracts structured insights.

From the text below:
1. Provide a short summary
2. Extract action items with:
   - task
   - owner (if mentioned)
   - deadline (if mentioned in date format dd-mm-yy)

Return strictly in JSON format:
{
  "summary": "...",
  "action_items": [
    {
      "task": "...",
      "owner": "...",
      "deadline": "..."
    }
  ]
}

Text:
${text}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

module.exports = { summarizeText };
