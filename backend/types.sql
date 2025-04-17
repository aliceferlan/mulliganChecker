-- supertypes

CREATE TABLE supertypes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- artist-names

CREATE TABLE artist_names (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- artifact-types
CREATE TABLE artifact_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- battle-types
CREATE TABLE battle_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- creature-types
CREATE TABLE creature_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- enchantment-types
CREATE TABLE enchantment_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- land types
CREATE TABLE land_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- planeswalker-types
CREATE TABLE planeswalker_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- spell types
CREATE TABLE spell_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- keywords
CREATE TABLE keywords (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);