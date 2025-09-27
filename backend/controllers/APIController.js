// This is what will control the API service call
const DataModel = require("../dbSchema/dbSchema");
const APIService = require("../services/APIService");
const { fetchCryptoData } = require("../services/APIService");

// Working on getting API data to be categorised by its different coins
// So far just focused on price...

// Fill up empty database but able to work with express API
async function populateEmptyDatabase(
  req,
  res = { status: () => ({ json: () => {} }) }
) {
  try {
    // checking if the database is empty by finding at least 1 entry
    const anyEntry = await DataModel.findOne();

    if (!anyEntry) {
      console.log("Database empty... populating...");
      await updateAllData();
      // return
      res.status(201).json({ message: "Database populated." });
    } else {
      console.log("Database is populated.");
      // return
      res.status(200).json({ message: "Database is not empty" });
    }
  } catch (error) {
    console.error("Error checking database:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

const getTechnicalData = async (symbol) => {
  try {
    const data = await fetchCryptoData("coingecko");
    return data;
  } catch (error) {
    console.error(`Error fetching technical data for ${symbol}:`, error);
    throw new Error("Failed to fetch technical data");
  }
};

// Updating everything
const updateAllData = async (req, res) => {
  try {
    const cryptoData = await APIService.fetchCryptoData();

    // No data retrieved or data malformed then stop
    if (!cryptoData || cryptoData.length === 0) {
      return res.status(404).json({ message: "Nothing found" });
    }

    // Formatting for the database (will update sentimentMetric and topic naming process)
    const dbEntries = cryptoData.map((entry) => ({
      source: entry.source,
      sentimentMetric: "metric", // Will update to include sentiment in future
      data: entry.data,
      topic: ["crypto", "price"], // Will adjust
    }));

    // Saving data to database
    // await DataModel.insertMany(dbEntries); // ended up making duplicates

    // Iterating over database to save properly
    for (const entry of dbEntries) {
      await DataModel.findOneAndUpdate(
        { source: entry.source },
        { $set: entry },
        { upsert: true } // Insert if not found
      );
    }
    res.status(201).json({ message: "Crypto data saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Updating from specific source
// will updating process of determining the source for now assuming manual input
const updateData = async (req, res) => {
  try {
    const { source } = req.body;

    // no source provided... not sure if this needs to be considered
    if (!source) {
      return res.status(400).json({ message: "Source is required" });
    }

    const cryptoData = await APIService.fetchCryptoData(source);

    // No data retrieved or data malformed then stop
    if (!cryptoData || cryptoData.length === 0) {
      return res.status(404).json({ message: "Nothing found" });
    }

    // collecting the singular piece of data
    const entry = cryptoData[0];

    // Making sure to just update/add this entry
    const updated = await DataModel.findOneAndUpdate(
      // findOneAndUpdate is a MongoDB method
      { source: entry.source },
      {
        // Found entry and updating
        $set: {
          data: entry.data,
          sentimentMetric: "metric", // will update to include sentiment in futures
          topic: ["crypto", "price"],
          date_updated: new Date(),
        },
      },
      // Not found so inserting
      { upsert: true, new: true }
    );
    res.status(200).json({
      message: `Crypto data from ${source} updated successfully!`,
      updated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  populateEmptyDatabase,
  updateAllData,
  updateData,
  getTechnicalData,
};
