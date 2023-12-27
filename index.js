const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json());

const fetchBookSuggestions = async (bookName, whyLiked) => {
  try {
    const prompt = `Book Name: ${bookName}\nWhy You Like It: ${whyLiked}`;
    const response = await axios.post(
      'https://api.openai.com/v1/engines/davinci/completions',
      {
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.5,
        n: 5, // Number of suggestions (adjust as needed)
        stop: '\n',
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const suggestions = response.data.choices.map(choice => choice.text.trim());
    return suggestions;
  } catch (error) {
    throw error;
  }
};

app.post('/book-suggestions', async (req, res) => {
  try {
    const { bookName, whyLiked } = req.body;
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
