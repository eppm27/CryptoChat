const GraphColour = (sparkline) => {
  if (!sparkline || sparkline.length < 2) return "gray";

  const startPrice = sparkline[0].price;
  const endPrice = sparkline[sparkline.length - 1].price;

  if (endPrice > startPrice) {
    return "green"; // positive trend - price increased
  } else if (endPrice < startPrice) {
    return "red"; // negative trend - price decreased
  } else {
    return "gray"; // neutral - no change
  }
};

export default GraphColour;
