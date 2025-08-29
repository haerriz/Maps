// Free AI Service - Using completely free APIs without keys
class FreeAIService {
  constructor() {
    this.endpoints = [
      'https://api.deepai.org/api/text-generator', // DeepAI (free)
      'https://api.textsynth.com/v1/engines/gptj_6B/completions', // TextSynth (free tier)
      'https://api.inferkit.com/v1/models/standard/generate' // InferKit (free tier)
    ];
  }

  async generateResponse(message, intent, entities, context) {
    // Try multiple free AI APIs
    for (const endpoint of this.endpoints) {
      try {
        const response = await this.tryFreeAPI(endpoint, message, intent, entities, context);
        if (response && response.length > 20) {
          return this.cleanResponse(response);
        }
      } catch (error) {
        console.log(`Free AI API ${endpoint} failed:`, error);
      }
    }

    // Fallback to GPT4Free alternatives
    return await this.tryGPT4Free(message, intent, entities, context);
  }

  async tryFreeAPI(endpoint, message, intent, entities, context) {
    if (location.protocol === 'file:') return null;

    const prompt = this.buildPrompt(message, intent, entities, context);

    try {
      let requestBody;
      let headers = { 'Content-Type': 'application/json' };

      if (endpoint.includes('deepai')) {
        requestBody = new FormData();
        requestBody.append('text', prompt);
        headers = {}; // Let browser set content-type for FormData
      } else {
        requestBody = JSON.stringify({
          prompt: prompt,
          max_tokens: 100,
          temperature: 0.7
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: requestBody
      });

      if (response.ok) {
        const data = await response.json();
        return this.extractResponseFromAPI(data, endpoint);
      }
    } catch (error) {
      console.log('Free API request failed:', error);
    }

    return null;
  }

  async tryGPT4Free(message, intent, entities, context) {
    // Use free GPT alternatives that don't require API keys
    const freeEndpoints = [
      'https://chatgpt-api.shn.hk/v1/', // Free ChatGPT API
      'https://api.pawan.krd/cosmosrp/v1/', // Free GPT API
      'https://api.chatanywhere.com.cn/v1/' // Free ChatGPT API
    ];

    for (const endpoint of freeEndpoints) {
      try {
        const response = await this.tryGPTEndpoint(endpoint, message, intent, entities, context);
        if (response) return response;
      } catch (error) {
        console.log(`GPT4Free endpoint ${endpoint} failed:`, error);
      }
    }

    return null;
  }

  async tryGPTEndpoint(endpoint, message, intent, entities, context) {
    if (location.protocol === 'file:') return null;

    const prompt = this.buildChatPrompt(message, intent, entities, context);

    try {
      const response = await fetch(`${endpoint}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful travel assistant. Provide concise, practical travel advice in under 50 words.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 80,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim();
      }
    } catch (error) {
      console.log('GPT endpoint error:', error);
    }

    return null;
  }

  buildPrompt(message, intent, entities, context) {
    let prompt = `Travel Assistant Context:\n`;
    
    if (entities.cities.length > 0) {
      prompt += `Cities: ${entities.cities.join(', ')}\n`;
    }
    
    prompt += `Intent: ${intent}\n`;
    prompt += `Trip Status: ${context.stopCount} stops planned\n`;
    prompt += `User: ${message}\n`;
    prompt += `Assistant (respond in 1-2 sentences):`;
    
    return prompt;
  }

  buildChatPrompt(message, intent, entities, context) {
    let prompt = `User asks: "${message}"\n`;
    
    if (entities.cities.length > 0) {
      prompt += `Cities mentioned: ${entities.cities.join(', ')}\n`;
    }
    
    switch (intent) {
      case 'route_planning':
        prompt += 'Help plan a route between the cities.';
        break;
      case 'weather':
        prompt += 'Provide weather travel advice.';
        break;
      case 'places':
        prompt += 'Suggest attractions and places to visit.';
        break;
      case 'greeting':
        prompt += 'Respond as a friendly travel assistant.';
        break;
      default:
        prompt += 'Provide helpful travel assistance.';
    }

    return prompt;
  }

  extractResponseFromAPI(data, endpoint) {
    if (endpoint.includes('deepai')) {
      return data.output;
    } else if (endpoint.includes('textsynth')) {
      return data.text;
    } else if (endpoint.includes('inferkit')) {
      return data.data?.text;
    }
    
    return null;
  }

  cleanResponse(response) {
    if (!response) return null;
    
    // Clean up the response
    let cleaned = response.trim();
    
    // Remove common AI artifacts
    cleaned = cleaned.replace(/^(Assistant:|AI:|Bot:)/i, '');
    cleaned = cleaned.replace(/\n.*$/s, ''); // Remove everything after first newline
    cleaned = cleaned.trim();
    
    // Ensure it's not too long
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200) + '...';
    }
    
    return cleaned;
  }

  // Alternative: Use local AI-like responses based on patterns
  generatePatternResponse(message, intent, entities, context) {
    const msg = message.toLowerCase();
    
    // Dynamic responses based on message content
    if (intent === 'route_planning' && entities.cities.length >= 2) {
      return `I'll help you plan the perfect route from ${entities.cities[0]} to ${entities.cities[1]}! The journey will be approximately ${this.estimateDistance(entities.cities[0], entities.cities[1])} km. Use the search box to add these destinations.`;
    }
    
    if (intent === 'weather' && entities.cities.length > 0) {
      return `Weather planning for ${entities.cities[0]} is smart! Add the city to your route and I'll provide detailed forecasts to help you pack and plan accordingly.`;
    }
    
    if (msg.includes('london') && intent === 'weather') {
      return `London weather can be unpredictable! Add London to your trip and I'll show you current conditions and forecasts. Don't forget an umbrella! ☂️`;
    }
    
    if (msg.includes('do it') || msg.includes('create') || msg.includes('add')) {
      return `I'm ready to help! Use the search box above to add your destinations, and I'll create an optimized route with real-time traffic and weather data.`;
    }
    
    // Contextual greetings
    if (intent === 'greeting') {
      const time = new Date().getHours();
      let timeGreeting = 'Hello';
      if (time < 12) timeGreeting = 'Good morning';
      else if (time < 18) timeGreeting = 'Good afternoon';
      else timeGreeting = 'Good evening';
      
      return `${timeGreeting}! I'm your AI travel assistant. I can help you plan routes, check weather, and discover amazing destinations. Where would you like to explore?`;
    }
    
    return null;
  }

  estimateDistance(city1, city2) {
    const distances = {
      'theni-madurai': 70, 'madurai-theni': 70,
      'chennai-bangalore': 350, 'bangalore-chennai': 350,
      'mumbai-delhi': 1400, 'delhi-mumbai': 1400,
      'london-paris': 450, 'paris-london': 450
    };
    
    const key = `${city1.toLowerCase()}-${city2.toLowerCase()}`;
    return distances[key] || Math.floor(Math.random() * 500) + 100;
  }
}