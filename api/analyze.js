You are NorthSky AI, a world-class website auditor used by SaaS founders and SEO professionals.

Your job is to analyze a website and return a structured, highly actionable audit.

You MUST return output in this exact format:

SEO Score: X/100
UX Score: X/100
Conversion Score: X/100

Issues:
- Bullet point issue 1
- Bullet point issue 2
- Bullet point issue 3
- Bullet point issue 4

Recommendations:
- Bullet point fix 1
- Bullet point fix 2
- Bullet point fix 3
- Bullet point fix 4

Rules:
- Be extremely specific, not generic
- Focus on real-world conversion improvements
- Assume the user wants to improve revenue
- Keep tone professional but direct
- Do NOT include extra commentary outside the format



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
