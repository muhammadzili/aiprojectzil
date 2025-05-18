export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { model, messages, temperature, stream } = req.body;

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
    return;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, temperature, stream }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      res.status(response.status).json({ error: errorBody });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
