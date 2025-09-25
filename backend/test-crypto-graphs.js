#!/usr/bin/env node

const axios = require('axios');

const testCryptoGraphs = async () => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'http://backend:3000'
    : 'http://localhost:3000';

  const cryptosToTest = [
    'bitcoin',
    'dogecoin', 
    'ethereum',
    'cardano',
    'solana'
  ];

  console.log('🧪 Testing crypto graph data availability...\n');

  for (const cryptoId of cryptosToTest) {
    try {
      console.log(`📊 Testing ${cryptoId}...`);
      
      const response = await axios.get(`${baseUrl}/api/crypto/${cryptoId}/graph-details`, {
        params: { period: '7' },
        timeout: 10000
      });

      const { priceData, ohlcData, marketCapData, cryptoInfo } = response.data;

      console.log(`✅ ${cryptoId.toUpperCase()} - SUCCESS`);
      console.log(`   • Price data points: ${priceData?.length || 0}`);
      console.log(`   • OHLC data points: ${ohlcData?.length || 0}`);
      console.log(`   • Market cap data: ${marketCapData?.length || 0}`);
      console.log(`   • Crypto info: ${cryptoInfo?.name} (${cryptoInfo?.symbol})`);
      console.log('');

    } catch (error) {
      console.log(`❌ ${cryptoId.toUpperCase()} - FAILED`);
      if (error.response) {
        console.log(`   • Status: ${error.response.status}`);
        console.log(`   • Message: ${error.response.data?.message || 'Unknown error'}`);
      } else {
        console.log(`   • Error: ${error.message}`);
      }
      console.log('');
    }
  }

  // Test chart support endpoint
  try {
    console.log('📋 Testing chart support endpoint...');
    const response = await axios.get(`${baseUrl}/api/crypto/cryptos-chart-support`);
    
    console.log(`✅ Chart support endpoint - SUCCESS`);
    console.log(`   • Total cryptocurrencies with chart support: ${response.data.count}`);
    
    // Find Dogecoin specifically
    const dogecoin = response.data.cryptocurrencies.find(crypto => crypto.id === 'dogecoin');
    if (dogecoin) {
      console.log(`   • Dogecoin found: ${dogecoin.name} (${dogecoin.symbol}) - Rank #${dogecoin.rank}`);
    } else {
      console.log(`   • ⚠️ Dogecoin not found in supported cryptocurrencies`);
    }
    
  } catch (error) {
    console.log(`❌ Chart support endpoint - FAILED`);
    console.log(`   • Error: ${error.message}`);
  }

  console.log('\n🏁 Test completed!');
};

if (require.main === module) {
  testCryptoGraphs().catch(console.error);
}

module.exports = { testCryptoGraphs };