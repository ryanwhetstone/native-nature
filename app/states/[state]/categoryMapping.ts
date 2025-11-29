export interface CategoryInfo {
  taxonId: number;
  displayName: string;
  pluralName: string;
}

export const categoryMapping: Record<string, CategoryInfo> = {
  plants: {
    taxonId: 47126,
    displayName: 'Plants',
    pluralName: 'plants'
  },
  conifers: {
    taxonId: 47375,
    displayName: 'Conifers',
    pluralName: 'conifers'
  },
  deciduous: {
    taxonId: 47853,
    displayName: 'Deciduous Trees',
    pluralName: 'deciduous trees'
  },
  fish: {
    taxonId: 47178,
    displayName: 'Fish',
    pluralName: 'fish'
  },
  birds: {
    taxonId: 3,
    displayName: 'Birds',
    pluralName: 'birds'
  },
  mammals: {
    taxonId: 40151,
    displayName: 'Mammals',
    pluralName: 'mammals'
  }
};
