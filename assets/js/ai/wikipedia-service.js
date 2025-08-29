// Wikipedia Service - Free knowledge API
class WikipediaService {
  constructor() {
    this.baseUrl = 'https://en.wikipedia.org/api/rest_v1/page';
    this.cache = new Map();
  }

  async getCityInfo(cityName) {
    const cacheKey = `wiki_${cityName.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (location.protocol === 'file:') {
      return this.getOfflineCityInfo(cityName);
    }

    try {
      const summary = await this.getWikipediaSummary(cityName);
      if (summary) {
        this.cache.set(cacheKey, summary);
        return summary;
      }
    } catch (error) {
      console.log('Wikipedia API failed:', error);
    }

    const fallback = this.getOfflineCityInfo(cityName);
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  async getWikipediaSummary(cityName) {
    try {
      const response = await fetch(`${this.baseUrl}/summary/${encodeURIComponent(cityName)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title,
          extract: data.extract,
          description: data.description,
          url: data.content_urls?.desktop?.page
        };
      }
    } catch (error) {
      console.log('Wikipedia summary failed:', error);
    }
    return null;
  }

  getOfflineCityInfo(cityName) {
    const cityData = {
      'chennai': {
        title: 'Chennai',
        extract: 'Chennai is the capital city of Tamil Nadu, known for Marina Beach (world\'s second-longest urban beach), rich cultural heritage, classical music, and delicious South Indian cuisine. Major attractions include Kapaleeshwarar Temple, Fort St. George, and Government Museum.',
        attractions: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Government Museum', 'San Thome Cathedral'],
        food: ['Idli', 'Dosa', 'Sambar', 'Rasam', 'Filter Coffee', 'Chettinad Cuisine']
      },
      'theni': {
        title: 'Theni',
        extract: 'Theni is a beautiful hill station in Tamil Nadu, famous for cardamom plantations, Meghamalai hills, and pleasant climate. It\'s a gateway to hill stations and offers stunning natural beauty with waterfalls and tea estates.',
        attractions: ['Meghamalai', 'Kumbakkarai Falls', 'Suruli Falls', 'Cardamom Plantations', 'Vaigai Dam'],
        food: ['South Indian meals', 'Fresh fruits', 'Cardamom tea', 'Local sweets']
      },
      'mumbai': {
        title: 'Mumbai',
        extract: 'Mumbai is India\'s financial capital and entertainment hub, home to Bollywood. Famous for Marine Drive, Gateway of India, bustling street life, and incredible street food culture.',
        attractions: ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Chhatrapati Shivaji Terminus', 'Bollywood Studios'],
        food: ['Vada Pav', 'Pav Bhaji', 'Bhel Puri', 'Dosa', 'Street Chaat']
      },
      'delhi': {
        title: 'Delhi',
        extract: 'Delhi is India\'s capital, blending ancient history with modern development. Home to Red Fort, India Gate, and numerous UNESCO World Heritage sites.',
        attractions: ['Red Fort', 'India Gate', 'Qutub Minar', 'Lotus Temple', 'Humayun\'s Tomb'],
        food: ['Butter Chicken', 'Chole Bhature', 'Paranthas', 'Kebabs', 'Kulfi']
      },
      'london': {
        title: 'London',
        extract: 'London is the capital of England and the UK, famous for Big Ben, Tower Bridge, Buckingham Palace, and rich history spanning over 2000 years.',
        attractions: ['Big Ben', 'Tower Bridge', 'Buckingham Palace', 'London Eye', 'British Museum'],
        food: ['Fish and Chips', 'Sunday Roast', 'Afternoon Tea', 'Bangers and Mash']
      },
      'paris': {
        title: 'Paris',
        extract: 'Paris is the capital of France, known as the City of Light. Famous for the Eiffel Tower, Louvre Museum, Notre-Dame, and romantic atmosphere.',
        attractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Arc de Triomphe', 'Champs-Élysées'],
        food: ['Croissants', 'French Cheese', 'Wine', 'Macarons', 'French Pastries']
      }
    };

    return cityData[cityName.toLowerCase()] || {
      title: cityName,
      extract: `${cityName} is a wonderful destination with rich culture and attractions. Add it to your trip to discover more!`,
      attractions: ['Local attractions', 'Cultural sites', 'Markets'],
      food: ['Local cuisine', 'Traditional dishes']
    };
  }

  async searchAttractions(cityName) {
    try {
      const searchResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/geosearch?latitude=0&longitude=0&radius=10000&limit=5`);
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        return data.pages?.map(page => page.title) || [];
      }
    } catch (error) {
      console.log('Wikipedia geosearch failed:', error);
    }

    const cityInfo = this.getOfflineCityInfo(cityName);
    return cityInfo.attractions || [];
  }
}