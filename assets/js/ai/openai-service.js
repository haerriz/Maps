// OpenAI Compatible Free Services
class OpenAIService {
  constructor() {
    this.endpoints = [
      'https://api.together.xyz/inference', // Together AI (free tier)
      'https://api.deepinfra.com/v1/inference', // DeepInfra (free)
      'https://api.runpod.ai/v2', // RunPod (free tier)
    ];
  }

  async generateResponse(message, intent, entities, context) {
    // Try multiple free OpenAI-compatible APIs
    for (const endpoint of this.endpoints) {
      try {
        const response = await this.tryEndpoint(endpoint, message, intent, entities, context);
        if (response) return response;
      } catch (error) {
        console.log(`OpenAI service ${endpoint} failed:`, error);
      }
    }

    return null;
  }

  async tryEndpoint(endpoint, message, intent, entities, context) {
    if (location.protocol === 'file:') return null;

    const prompt = this.buildChatPrompt(message, intent, entities, context);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful travel assistant for Haerriz Maps. Provide concise, helpful travel advice.'
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim();
      }
    } catch (error) {
      console.log('OpenAI endpoint error:', error);
    }

    return null;
  }

  buildChatPrompt(message, intent, entities, context) {
    let prompt = `User message: "${message}"\n`;
    
    if (entities.cities.length > 0) {
      prompt += `Cities mentioned: ${entities.cities.join(', ')}\n`;
    }
    
    prompt += `Intent: ${intent}\n`;
    prompt += `Current trip: ${context.stopCount} stops planned\n`;
    
    switch (intent) {
      case 'route_planning':
        prompt += 'Help the user plan their route between the mentioned cities.';
        break;
      case 'weather':
        prompt += 'Provide weather-related travel advice.';
        break;
      case 'places':
        prompt += 'Suggest attractions and places to visit.';
        break;
      case 'greeting':
        prompt += 'Respond with a friendly travel assistant greeting.';
        break;
      default:
        prompt += 'Provide helpful travel assistance.';
    }

    return prompt;
  }

  async classifyIntent(message) {
    // Use a simple classification approach for OpenAI services
    const intents = {
      route_planning: ['plan', 'route', 'from', 'to', 'travel', 'go', 'trip'],
      weather: ['weather', 'temperature', 'rain', 'sunny', 'climate'],
      places: ['visit', 'see', 'attractions', 'places', 'tourist'],
      greeting: ['hi', 'hello', 'hey', 'good morning'],
      help: ['help', 'how', 'what', 'guide']
    };

    const msg = message.toLowerCase();
    let bestIntent = 'general';
    let bestScore = 0;

    Object.entries(intents).forEach(([intent, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (msg.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > bestScore) {
        bestIntent = intent;
        bestScore = score;
      }
    });

    return { intent: bestIntent, confidence: bestScore > 0 ? 0.8 : 0.3 };
  }
}