# -*- coding=utf-8 -*-

import json
import os
from collections import namedtuple

from config import CWD


RubriqueInfo = namedtuple("RUBRIQUE_INFO", ["category", "waste_type"])


def get_rubrique_info(rubrique, alinea=None):

    filedir = os.path.dirname(os.path.realpath(__file__))
    filepath = os.path.join(filedir, "json", "rubriques.json")

    with open(filepath, 'r') as f:
        rubrique_info = json.load(f)
        info = rubrique_info.get(rubrique)

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