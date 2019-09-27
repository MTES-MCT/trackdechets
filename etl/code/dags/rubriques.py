# -*- coding=utf-8 -*-

from collections import namedtuple

RUBRIQUES = {
  '2710': {
    '1a': {
      'category': 'WASTE_CENTER',
      'waste_type': 'DANGEROUS'
    },
    '1b': {
      'category': 'WASTE_CENTER',
      'waste_type': 'DANGEROUS'
    },
    '2a': {
      'category': 'WASTE_CENTER',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2b': {
      'category': 'WASTE_CENTER',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2711': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2712': {
    '1': {
      'category': 'WASTE_VEHICLES',
      'waste_type': 'DANGEROUS'
    },
    '2': {
      'category': 'WASTE_VEHICLES',
      'waste_type': 'DANGEROUS'
    },
    '3a': {
      'category': 'WASTE_VEHICLES',
      'waste_type': 'DANGEROUS'
    },
    '3b': {
      'category': 'WASTE_VEHICLES',
      'waste_type': 'DANGEROUS'
    }
  },
  '2713': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2714': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2715': {
    'category': 'COLLECTOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2716': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2718': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2719': {
    'category': 'COLLECTOR',
    'waste_type': 'DANGEROUS'
  },
  '2720': {
    '1': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '2': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2730': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2731': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '3a': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '3b': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2740': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2750': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2751': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2752': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2760': {
    '1': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '3': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'INERTE'
    },
    '4': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '2a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2770': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'DANGEROUS'
  },
  '2771': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2780': {
    '1a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '1b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '1c': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2c': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '3a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '3b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2781': {
    '1a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '1b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '1c': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2782': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '2790': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'DANGEROUS'
  },
  '2791': {
    '1': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2792': {
    '2': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '1a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '1b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2793': {
    '1a': {
      'category': 'WASTE_CENTER',
      'waste_type': 'DANGEROUS'
    },
    '1b': {
      'category': 'WASTE_CENTER',
      'waste_type': 'DANGEROUS'
    },
    '1c': {
      'category': 'WASTE_CENTER',
      'waste_type': 'DANGEROUS'
    },
    '2a': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    },
    '2b': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    },
    '3a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '3b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2794': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    '2': {
      'category': 'COLLECTOR',
      'waste_type': 'NOT_DANGEROUS'
    }
  },
  '2795': {
    '1': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    },
    '2': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2797': {
    '1': {
      'category': 'COLLECTOR',
      'waste_type': 'DANGEROUS'
    },
    '2': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '2798': {
    'category': 'COLLECTOR',
    'waste_type': 'DANGEROUS'
  },
  '3510': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'DANGEROUS'
  },
  '3520': {
    'a': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'NOT_DANGEROUS'
    },
    'b': {
      'category': 'WASTEPROCESSOR',
      'waste_type': 'DANGEROUS'
    }
  },
  '3531': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '3532': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  },
  '3540': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'DANGEROUS'
  },
  '3550': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'DANGEROUS'
  },
  '3560': {
    'category': 'WASTEPROCESSOR',
    'waste_type': 'NOT_DANGEROUS'
  }
}


RubriqueInfo = namedtuple("RUBRIQUE_INFO", ["category", "waste_type"])


def get_rubrique_info(rubrique, alinea=None):

    info = RUBRIQUES.get(rubrique)

    if info:
        if alinea:
            try:
                info = info[alinea]
            except KeyError:
                pass

        category = info.get("category")
        waste_type = info.get("waste_type")

        if category and waste_type:
            return RubriqueInfo(category, waste_type)

    return None
