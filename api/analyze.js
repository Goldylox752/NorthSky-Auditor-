import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { site, prompt } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior website auditor. Return structured SEO/UX/conversion analysis.",
        },
        {
          role: "user",
          content: prompt || `Analyze this site: ${site}`,
        },
      ],
    });

    const text = completion.choices[0].message.content;

    res.status(200).json({
      result: text,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "AI request failed",
    });
  }
}
