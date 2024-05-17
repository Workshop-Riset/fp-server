const byPreference = (preference) => {
  const rand = Math.random();
  let probabilities;
  switch (preference) {
    case "adventure":
      probabilities = [0.5, 0.25, 0.25];
      break;
    case "social":
      probabilities = [0.25, 0.5, 0.25];
      break;
    case "self":
      probabilities = [0.5, 0.25, 0.5];
      break;
  }

  if (rand < probabilities[0]) {
    return 0;
  } else if (rand < probabilities[0] + probabilities[1]) {
    return 1;
  } else {
    return 2;
  }
};

module.exports = byPreference;
