// const axios = require("axios");
const mongoose = require("mongoose");
const Crypto = require("../dbSchema/cryptoSchema");
const { fetchIndividualCryptoDetails,fetchTopCryptos, enrichCryptoFields } = require("../services/frontendCryptoService");


// how similar is it for this and the other one 
const fetchAndSaveAllCryptoList = async () => {
  try {

    const topCoins = await fetchTopCryptos();

    let batch = [];
    let index = 0;
    console.log("finished fetching all markets");

    for (const coin of topCoins) {
      
      console.log(`Fetching details for ${coin.id}, index is ${index}`);
      await new Promise(resolve => setTimeout(resolve, 15000));    // prevent call exceeding coinGecko limit 

      const addedFields = await fetchIndividualCryptoDetails(coin.id);

      if (addedFields) { // only proceed with successful return from coin details
        const coinDetails = enrichCryptoFields(coin, addedFields);

        batch.push(coinDetails); 
        index++;
        console.log(`✅ Successfully fetched ${coin.id}`);

        if (batch.length === 10) {
          await Crypto.insertMany(batch);
          console.log(`✅ Batch of 10 coins saved successfully`);

          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      await Crypto.insertMany(batch);
      console.log(`✅ Remaining coins saved successfully`);
    }

  } catch (error) {
    console.error( 'Error fetching and saving crypto data from coinGecko:', error);
  }
}

mongoose
  .connect(process.env.MONGODB_URI_CRYPTO)
  .then(() => {
    // call the function to save all cryptocurrencies
    return fetchAndSaveAllCryptoList();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
