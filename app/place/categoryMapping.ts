export interface CategoryInfo {
  taxonId: number;
  displayName: string;
  pluralName: string;
  emoji: string;
  colors: {
    border: string;
    hover: string;
    text: string;
  };
}

export const categoryMapping: Record<string, CategoryInfo> = {
  plants: {
    taxonId: 47126,
    displayName: 'Plants',
    pluralName: 'plants',
    emoji: '🌿',
    colors: {
      border: 'border-green-500',
      hover: 'hover:border-green-500 hover:bg-green-50',
      text: 'group-hover:text-green-700'
    }
  },
  conifers: {
    taxonId: 47375,
    displayName: 'Conifers',
    pluralName: 'conifers',
    emoji: '🌲',
    colors: {
      border: 'border-green-600',
      hover: 'hover:border-green-600 hover:bg-green-50',
      text: 'group-hover:text-green-700'
    }
  },
  deciduous: {
    taxonId: 47853,
    displayName: 'Deciduous Trees',
    pluralName: 'deciduous trees',
    emoji: '🍂',
    colors: {
      border: 'border-amber-600',
      hover: 'hover:border-amber-600 hover:bg-amber-50',
      text: 'group-hover:text-amber-700'
    }
  },
  fish: {
    taxonId: 47178,
    displayName: 'Fish',
    pluralName: 'fish',
    emoji: '🐟',
    colors: {
      border: 'border-blue-600',
      hover: 'hover:border-blue-600 hover:bg-blue-50',
      text: 'group-hover:text-blue-700'
    }
  },
  birds: {
    taxonId: 3,
    displayName: 'Birds',
    pluralName: 'birds',
    emoji: '🦅',
    colors: {
      border: 'border-sky-600',
      hover: 'hover:border-sky-600 hover:bg-sky-50',
      text: 'group-hover:text-sky-700'
    }
  },
  mammals: {
    taxonId: 40151,
    displayName: 'Mammals',
    pluralName: 'mammals',
    emoji: '🦌',
    colors: {
      border: 'border-orange-600',
      hover: 'hover:border-orange-600 hover:bg-orange-50',
      text: 'group-hover:text-orange-700'
    }
  },
  reptiles: {
    taxonId: 26036,
    displayName: 'Reptiles',
    pluralName: 'reptiles',
    emoji: '🦎',
    colors: {
      border: 'border-lime-600',
      hover: 'hover:border-lime-600 hover:bg-lime-50',
      text: 'group-hover:text-lime-700'
    }
  },
  amphibians: {
    taxonId: 20978,
    displayName: 'Amphibians',
    pluralName: 'amphibians',
    emoji: '🐸',
    colors: {
      border: 'border-teal-600',
      hover: 'hover:border-teal-600 hover:bg-teal-50',
      text: 'group-hover:text-teal-700'
    }
  },
  insects: {
    taxonId: 47158,
    displayName: 'Insects',
    pluralName: 'insects',
    emoji: '🐛',
    colors: {
      border: 'border-yellow-600',
      hover: 'hover:border-yellow-600 hover:bg-yellow-50',
      text: 'group-hover:text-yellow-700'
    }
  },
  arachnids: {
    taxonId: 47119,
    displayName: 'Arachnids',
    pluralName: 'arachnids',
    emoji: '🕷️',
    colors: {
      border: 'border-purple-600',
      hover: 'hover:border-purple-600 hover:bg-purple-50',
      text: 'group-hover:text-purple-700'
    }
  },
  butterflies: {
    taxonId: 47157,
    displayName: 'Butterflies & Moths',
    pluralName: 'butterflies and moths',
    emoji: '🦋',
    colors: {
      border: 'border-pink-600',
      hover: 'hover:border-pink-600 hover:bg-pink-50',
      text: 'group-hover:text-pink-700'
    }
  },
  fungi: {
    taxonId: 47170,
    displayName: 'Fungi',
    pluralName: 'fungi',
    emoji: '🍄',
    colors: {
      border: 'border-red-600',
      hover: 'hover:border-red-600 hover:bg-red-50',
      text: 'group-hover:text-red-700'
    }
  },
  molluscs: {
    taxonId: 47115,
    displayName: 'Molluscs',
    pluralName: 'molluscs',
    emoji: '🐌',
    colors: {
      border: 'border-indigo-600',
      hover: 'hover:border-indigo-600 hover:bg-indigo-50',
      text: 'group-hover:text-indigo-700'
    }
  }
};
