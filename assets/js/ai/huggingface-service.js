// Hugging Face AI Service
class HuggingFaceService {
  constructor() {
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.models = {
      intent: 'facebook/bart-large-mnli',
      ner: 'dbmdz/bert-large-cased-finetuned-conll03-english',
      generation: 'gpt2',
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      qa: 'deepset/roberta-base-squad2'
    };
  }

  async classifyIntent(message) {
    if (location.protocol === 'file:') return { intent: 'general', confidence: 0.5 };

    try {
      const response = await fetch(`${this.baseUrl}/${this.models.intent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            candidate_labels: [
              'route planning and navigation',
              'weather information request', 
              'tourist attractions and places',
              'greeting and conversation',
              'identity and help questions',
              'location search and finding',
              'travel recommendations',
              'traffic and road conditions'
            ]
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const intent = this.mapIntent(data.labels[0]);
        return { intent, confidence: data.scores[0] };
      }
    } catch (error) {
      console.log('HuggingFace intent classification failed:', error);
    }

    return { intent: 'general', confidence: 0.3 };
  }

  mapIntent(label) {
    const mapping = {
      'route planning and navigation': 'route_planning',
      'weather information request': 'weather',
      'tourist attractions and places': 'places',
      'greeting and conversation': 'greeting',
      'identity and help questions': 'help',
      'location search and finding': 'location',
      'travel recommendations': 'recommendations',
      'traffic and road conditions': 'traffic'
    };
    return mapping[label] || 'general';
  }

  async extractEntities(message) {
    if (location.protocol === 'file:') return { cities: [], places: [], keywords: [] };

    try {
      const response = await fetch(`${this.baseUrl}/${this.models.ner}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: message })
      });

      if (response.ok) {
        const data = await response.json();
        return this.parseNERResults(data);
      }
    } catch (error) {
      console.log('HuggingFace NER failed:', error);
    }

    return { cities: [], places: [], keywords: [] };
  }

  parseNERResults(nerData) {
    const entities = { cities: [], places: [], keywords: [] };
    
    if (Array.isArray(nerData)) {
      nerData.forEach(entity => {
        if (entity.entity_group === 'LOC' || entity.entity === 'B-LOC') {
          entities.cities.push(entity.word.replace('##', ''));
        } else if (entity.entity_group === 'MISC') {
          entities.places.push(entity.word.replace('##', ''));
        }
      });
    }

    return entities;
  }

  async generateResponse(message, intent, entities, context) {
    if (location.protocol === 'file:') return null;

    try {
      const prompt = this.buildPrompt(message, intent, entities, context);
      
      const response = await fetch(`${this.baseUrl}/${this.models.generation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return this.extractResponse(data[0]?.generated_text, prompt);
      }
    } catch (error) {
      console.log('HuggingFace generation failed:', error);
    }

    return null;
  }

  buildPrompt(message, intent, entities, context) {
    let prompt = "Travel Assistant: I help plan trips, routes, and provide travel information.\n\n";
    
    if (entities.cities.length > 0) {
      prompt += `Cities mentioned: ${entities.cities.join(', ')}\n`;
    }
    
    prompt += `User intent: ${intent}\n`;
    prompt += `Context: ${context.stopCount} stops, ${context.hasRoute ? 'route exists' : 'no route'}\n`;
    prompt += `User: ${message}\n`;
    prompt += "Assistant:";
    
    return prompt;
  }

  extractResponse(generatedText, prompt) {
    if (!generatedText) return null;
    
    const assistantIndex = generatedText.lastIndexOf('Assistant:');
    if (assistantIndex !== -1) {
      const response = generatedText.substring(assistantIndex + 10).trim();
      const lines = response.split('\n');
      return lines[0].trim();
    }
    
    return null;
  }

  async answerQuestion(question, context) {
    if (location.protocol === 'file:') return null;

    try {
      const response = await fetch(`${this.baseUrl}/${this.models.qa}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: {
            question: question,
            context: context
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.answer;
      }
    } catch (error) {
      console.log('HuggingFace QA failed:', error);
    }

    return null;
  }
}