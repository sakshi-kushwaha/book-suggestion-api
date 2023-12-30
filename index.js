const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
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

    const suggestionsText = response.data.choices[0].text.trim();

    const parsedSuggestions = parseBookSuggestions(suggestionsText);
    const improvedSuggestions = improveSuggestions(parsedSuggestions);

    return improvedSuggestions;
  } catch (error) {
    throw error;
  }
};

const parseBookSuggestions = (text) => {
  const suggestions = [];
  const books = text.split('"');
  
  for (let i = 1; i < books.length; i += 2) {
    const book = books[i];
    const reasons = (books[i + 1] || '').split(',').map(reason => reason.trim()).filter(Boolean);
    const formattedReasons = reasons.join(', ');
    
    suggestions.push({ book, reason: formattedReasons });
  }
  
  return suggestions;
};



const improveSuggestions = (suggestions) => {
  const improvedSuggestions = [];
  let i = 0;
  
  while (i < suggestions.length) {
    const currentSuggestion = suggestions[i];
    let { book, reason } = currentSuggestion;

    if (book.endsWith(':')) {
      const nextSuggestion = suggestions[i + 1];
      if (nextSuggestion && nextSuggestion.book.startsWith(book)) {
        reason += ` ${nextSuggestion.reason}`;
        i++;
      }
    }

    improvedSuggestions.push({ book, reason });
    i++;
  }

  return improvedSuggestions;
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
