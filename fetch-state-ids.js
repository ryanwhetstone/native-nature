const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

async function getStateId(stateName) {
  const response = await fetch(`https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(stateName)}`);
  const data = await response.json();
  const state = data.results.find(r => 
    r.place_type === 8 && 
    r.display_name.includes('US') &&
    r.name.toLowerCase() === stateName.toLowerCase()
  );
  return state ? state.id : null;
}

async function getAllStateIds() {
  const mapping = {};
  
  for (const state of states) {
    const id = await getStateId(state);
    const slug = state.toLowerCase().replace(/\s+/g, "-");
    mapping[slug] = id;
    console.log(`  "${slug}": ${id},`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  return mapping;
}

getAllStateIds();
