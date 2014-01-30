

/** classes have base stats/growths used for calculating enemy stuff
    They also have caps, but that can come later
    so, player units are determined by their own bases/growths
    while enemies are determined by this */
var classData = {
    Assassin : {
        base : {
            HP      : 20,
            Strength  : 10,
            Magic   : 0,
            Defense : 7,
            Skill   : 10,
            Speed   : 10,
            Luck    : 10,
            Resistance : 5,
            Build   : 7,
            Movement: 6
        },
        growth : {
            HP      : 90,
            Strength  : 40,
            Magic   : 10,
            Defense : 30,
            Skill   : 60,
            Speed   : 60,
            Luck    : 50,
            Resistance : 20,
            Build   : 0,
            Movement : 0
        },

        weaponLevel : {
            Sword : 3,
        }

    },

    Myrmidon : {
        base : {
            HP      : 25,
            Strength  : 8,
            Magic   : 0,
            Defense : 7,
            Skill   : 20,
            Speed   : 20,
            Luck    : 10,
            Resistance : 5,
            Build   : 7,
            Movement: 5
        },
        growth : {
            HP      : 90,
            Strength  : 40,
            Magic   : 10,
            Defense : 30,
            Skill   : 70,
            Speed   : 70,
            Luck    : 50,
            Resistance : 20,
            Build   : 0,
            Movement : 0
        },

        weaponLevel : {
            Sword : 3,
        }

    }
}

/** These values are added to base stats, so, level-to-level keeping track
  * will eventually be a bitch, but oh well */
var characterData = {
    Jaffar : {
        base : {
            HP      : 20,
            Strength  : 3,
            Magic   : 0,
            Defense : 2,
            Skill   : 5,
            Speed   : 5,
            Luck    : 7,
            Resistance : 5,
            Build   : 7,
            Movement: 0
        },
        growth : {
            HP      : 40,
            Strength  : 20,
            Magic   : 0,
            Defense : 10,
            Skill   : 20,
            Speed   : 20,
            Luck    : 30,
            Resistance : 0,
            Build   : 0,
            Movement : 0
        }
    },

    Marth : {
        base : {
            HP      : 20,
            Strength  : 3,
            Magic   : 0,
            Defense : 2,
            Skill   : 5,
            Speed   : 5,
            Luck    : 7,
            Resistance : 5,
            Build   : 7,
            Movement: 0
        },
        growth : {
            HP      : 40,
            Strength  : 20,
            Magic   : 0,
            Defense : 10,
            Skill   : 20,
            Speed   : 20,
            Luck    : 30,
            Resistance : 0,
            Build   : 0,
            Movement : 0
        }
    },

    Eliwood : {
        base : {
            HP      : 20,
            Strength  : 3,
            Magic   : 0,
            Defense : 2,
            Skill   : 5,
            Speed   : 5,
            Luck    : 7,
            Resistance : 5,
            Build   : 7,
            Movement: 0
        },
        growth : {
            HP      : 40,
            Strength  : 20,
            Magic   : 0,
            Defense : 10,
            Skill   : 20,
            Speed   : 20,
            Luck    : 30,
            Resistance : 0,
            Build   : 0,
            Movement : 0
        }
    }
}

var weaponData = {
    "Iron Sword" : {
            Might   : 5,
            Hit     : 90,
            Crit    : 0,
            Weight  : 5,
            DamageType    : "Physical",
            Range   : 1,
            Type    : "Sword",
            Uses    : 50,
            Level   : 1
    },
    "Steel Sword" : {
            Might   : 8,
            Hit     : 90,
            Crit    : 0,
            Weight  : 8,
            DamageType    : "Physical",
            Range   : 1,
            Type    : "Sword",
            Uses    : 35,
            Level   : 3
    }
}

var itemsData = {
    "Vulnerary" : { Uses : 3,
                    Effect : function(unit) {
                        unit.currentHP += 10
                        unit.currentHP = min(unit.currentHP, unit.HP)
                    }}
}

var terrainData = {
    "Plain"   : { Def : 0, Avoid : 0, cost: 1},
    "Forest"  : { Def : 1, Avoid : 20, cost: 2},
    "Mountain": { Def : 3, Avoid : 40, cost: 4}
}