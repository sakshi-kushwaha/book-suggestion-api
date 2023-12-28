const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());

const fetchBookSuggestions = async (bookName, whyLiked) => {
  try {
    const prompt = `Generate book suggestions similar to "${bookName}" based on why it's liked: "${whyLiked}"\nSuggestions:`;
    
    const response = await axios.post(
      'https://api.openai.com/v1/engines/davinci/completions',
      {
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.5,
        n: 3,
        stop: '\n',
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const choices = response.data.choices;

    const suggestions = choices.map(choice => {
      const text = choice.text.trim();
      const splitText = text.split(', "');
      const book = splitText[0].replace(/"/g, '');
      const reason = splitText.slice(1).join(', "').replace(/"/g, '');
      return { book, reason };
    });

    return suggestions;
  } catch (error) {
    throw error;
  }
};

app.post('/book-suggestions', async (req, res) => {
  try {
    const { bookName, whyLiked } = req.body;
    if (!bookName || !whyLiked) {
      return res.status(400).json({ error: 'Invalid request. Please provide bookName and whyLiked.' });
    }
    const suggestions = await fetchBookSuggestions(bookName, whyLiked);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in POST request:', error);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
