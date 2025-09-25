import React from "react";
import ExploreTable from "../components/ExploreTable";

const CryptoExplorePage = () => {

  return (
    <div className="py-4">
      <p className="mx-6 font-bold text-left mb-4 text-2xl text-customNavyBlue">Top 500 Cryptocurrency Prices by Market Cap</p>
      <ExploreTable/>
    </div>
  )
}

export default CryptoExplorePage;
