import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { model, messages, temperature, stream } = req.body;

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, // key di .env
      },
      body: JSON.stringify({ model, messages, temperature, stream }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      return res.status(groqResponse.status).json({ error: errorData });
    }

    const data = await groqResponse.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
