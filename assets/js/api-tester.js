// API Tester - Test all APIs directly in console
class APITester {
  constructor() {
    this.results = {};
  }

  async testAllAPIs() {
    console.log('🧪 Testing All APIs...');
    
    await this.testHuggingFace();
    await this.testWikipedia();
    await this.testWeather();
    await this.testGeocoding();
    
    console.log('📊 API Test Results:', this.results);
    return this.results;
  }

  async testHuggingFace() {
    console.log('🤖 Testing Hugging Face APIs...');
    
    // Test Intent Classification
    try {
      const intentResponse = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: "I want to travel from Mumbai to Delhi",
          parameters: {
            candidate_labels: ['route planning', 'weather request', 'tourist attractions', 'greeting']
          }
        })
      });

      if (intentResponse.ok) {
        const intentData = await intentResponse.json();
        console.log('✅ HuggingFace Intent Classification:', intentData);
        this.results.huggingface_intent = { status: 'success', data: intentData };
      } else {
        const errorText = await intentResponse.text();
        console.log('❌ HuggingFace Intent Failed:', intentResponse.status, errorText);
        this.results.huggingface_intent = { status: 'failed', error: errorText, code: intentResponse.status };
      }
    } catch (error) {
      console.log('❌ HuggingFace Intent Error:', error);
      this.results.huggingface_intent = { status: 'error', error: error.message };
    }

    // Test Text Generation
    try {
      const genResponse = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: "Travel to Paris is",
          parameters: { max_length: 50, temperature: 0.7 }
        })
      });

      if (genResponse.ok) {
        const genData = await genResponse.json();
        console.log('✅ HuggingFace Text Generation:', genData);
        this.results.huggingface_generation = { status: 'success', data: genData };
      } else {
        const errorText = await genResponse.text();
        console.log('❌ HuggingFace Generation Failed:', genResponse.status, errorText);
        this.results.huggingface_generation = { status: 'failed', error: errorText, code: genResponse.status };
      }
    } catch (error) {
      console.log('❌ HuggingFace Generation Error:', error);
      this.results.huggingface_generation = { status: 'error', error: error.message };
    }
  }

  async testWikipedia() {
    console.log('📚 Testing Wikipedia API...');
    
    try {
      const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Paris');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wikipedia API:', data.extract.substring(0, 100) + '...');
        this.results.wikipedia = { status: 'success', extract: data.extract };
      } else {
        console.log('❌ Wikipedia Failed:', response.status);
        this.results.wikipedia = { status: 'failed', code: response.status };
      }
    } catch (error) {
      console.log('❌ Wikipedia Error:', error);
      this.results.wikipedia = { status: 'error', error: error.message };
    }
  }

  async testWeather() {
    console.log('🌤️ Testing Weather APIs...');
    
    // Test wttr.in
    try {
      const response = await fetch('https://wttr.in/London?format=j1');
      
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition?.[0];
        if (current) {
          console.log('✅ Weather API (wttr.in):', `${current.temp_C}°C, ${current.weatherDesc?.[0]?.value}`);
          this.results.weather_wttr = { status: 'success', temp: current.temp_C, condition: current.weatherDesc?.[0]?.value };
        }
      } else {
        console.log('❌ Weather API Failed:', response.status);
        this.results.weather_wttr = { status: 'failed', code: response.status };
      }
    } catch (error) {
      console.log('❌ Weather API Error:', error);
      this.results.weather_wttr = { status: 'error', error: error.message };
    }

    // Test Open-Meteo
    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true');
      
      if (response.ok) {
        const data = await response.json();
        const current = data.current_weather;
        if (current) {
          console.log('✅ Weather API (Open-Meteo):', `${current.temperature}°C, Wind: ${current.windspeed} km/h`);
          this.results.weather_openmeteo = { status: 'success', temp: current.temperature, wind: current.windspeed };
        }
      } else {
        console.log('❌ Open-Meteo Failed:', response.status);
        this.results.weather_openmeteo = { status: 'failed', code: response.status };
      }
    } catch (error) {
      console.log('❌ Open-Meteo Error:', error);
      this.results.weather_openmeteo = { status: 'error', error: error.message };
    }
  }

  async testGeocoding() {
    console.log('🗺️ Testing Geocoding APIs...');
    
    try {
      // Photon is CORS-safe, no rate limit, same OSM data
      const response = await fetch('https://photon.komoot.io/api/?q=Mumbai&limit=1');
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          console.log('✅ Photon API:', data.features[0].properties.name);
          this.results.geocoding = { status: 'success', location: data.features[0].properties.name };
        }
      } else {
        console.log('❌ Photon Failed:', response.status);
        this.results.geocoding = { status: 'failed', code: response.status };
      }
    } catch (error) {
      console.log('❌ Photon Error:', error);
      this.results.geocoding = { status: 'error', error: error.message };
    }
  }

  // Test specific AI functionality
  async testAIFunctionality() {
    console.log('🧠 Testing AI Functionality...');
    
    const testCases = [
      { input: 'weather in London', expected: 'weather info' },
      { input: 'Mumbai to Delhi', expected: 'route planning' },
      { input: 'tell me about Paris', expected: 'city information' }
    ];

    for (const testCase of testCases) {
      try {
        if (window.aiManager) {
          const context = { stopCount: 0, hasRoute: false };
          const response = await window.aiManager.processMessage(testCase.input, context);
          console.log(`🧪 AI Test "${testCase.input}":`, response.substring(0, 100) + '...');
        }
      } catch (error) {
        console.log(`❌ AI Test "${testCase.input}" failed:`, error);
      }
    }
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_apis: Object.keys(this.results).length,
        working: Object.values(this.results).filter(r => r.status === 'success').length,
        failed: Object.values(this.results).filter(r => r.status === 'failed').length,
        errors: Object.values(this.results).filter(r => r.status === 'error').length
      },
      details: this.results,
      recommendations: this.getRecommendations()
    };

    console.log('📋 API Test Report:', report);
    return report;
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.results.huggingface_intent?.status !== 'success') {
      recommendations.push('HuggingFace API not working - use local pattern matching for intent detection');
    }
    
    if (this.results.wikipedia?.status !== 'success') {
      recommendations.push('Wikipedia API not working - use local knowledge base for city information');
    }
    
    if (this.results.weather_wttr?.status !== 'success' && this.results.weather_openmeteo?.status !== 'success') {
      recommendations.push('Weather APIs not working - use local weather advice based on location');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All APIs working - can use dynamic responses');
    }
    
    return recommendations;
  }
}

// Global functions for console testing
window.testAPIs = async function() {
  const tester = new APITester();
  await tester.testAllAPIs();
  return tester.generateReport();
};

window.testAI = async function() {
  const tester = new APITester();
  await tester.testAIFunctionality();
};

window.testHF = async function() {
  const tester = new APITester();
  await tester.testHuggingFace();
  return tester.results;
};

// Auto-test disabled: fires HuggingFace (CORS-blocked) and wttr.in calls that pollute
// the console and cause false CORS errors on every page load.
// Run manually: window.testAPIs() or window.testAI()
window.addEventListener('DOMContentLoaded', () => {
  // Tester available but NOT auto-run
  window.apiTester = null;
});