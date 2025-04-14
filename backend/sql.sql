-- cards テーブル（メインとなるカード情報）
CREATE TABLE cards (
    id VARCHAR(36) PRIMARY KEY,  -- ScryfallのUUID
    oracle_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    mana_cost VARCHAR(50),
    cmc DECIMAL(10, 1),
    type_line VARCHAR(255),
    oracle_text TEXT,
    colors VARCHAR(20),  -- JSON配列から変換 (例: 'W,U,B,R,G')
    color_identity VARCHAR(20),  -- JSON配列から変換
    keywords VARCHAR(500),  -- JSON配列から変換
    power VARCHAR(10),
    toughness VARCHAR(10),
    loyalty VARCHAR(10),
    produced_mana VARCHAR(20),  -- JSON配列から変換
    rarity VARCHAR(20),
    layout VARCHAR(50),
    reserved BOOLEAN DEFAULT FALSE,
    foil BOOLEAN DEFAULT FALSE,
    nonfoil BOOLEAN DEFAULT FALSE,
    game_changer BOOLEAN DEFAULT FALSE,
    digital BOOLEAN DEFAULT FALSE,
    released_at DATE,
    edhrec_rank INTEGER,
    penny_rank INTEGER,
    artist VARCHAR(255),
    artist_id VARCHAR(36),
    scryfall_uri VARCHAR(255)
);

-- card_faces テーブル（両面カード、分割カード用）
CREATE TABLE card_faces (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    face_index INTEGER NOT NULL,  -- 面のインデックス (0 or 1)
    name VARCHAR(255) NOT NULL,
    mana_cost VARCHAR(50),
    type_line VARCHAR(255),
    oracle_text TEXT,
    colors VARCHAR(20),
    power VARCHAR(10),
    toughness VARCHAR(10),
    loyalty VARCHAR(10),
    flavor_text TEXT,
    artist VARCHAR(255),
    artist_id VARCHAR(36),
    illustration_id VARCHAR(36),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- sets テーブル（セット情報）
CREATE TABLE sets (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    set_type VARCHAR(50),
    released_at DATE,
    card_count INTEGER,
    digital BOOLEAN DEFAULT FALSE,
    scryfall_uri VARCHAR(255)
);

-- printings テーブル（カードの印刷情報）
CREATE TABLE printings (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    set_id VARCHAR(36) NOT NULL,
    collector_number VARCHAR(20),
    printed_name VARCHAR(255),
    printed_type_line VARCHAR(255),
    printed_text TEXT,
    lang VARCHAR(10),
    multiverse_ids VARCHAR(255),  -- JSONから変換
    mtgo_id INTEGER,
    arena_id INTEGER,
    tcgplayer_id INTEGER,
    cardmarket_id INTEGER,
    border_color VARCHAR(20),
    frame VARCHAR(20),
    security_stamp VARCHAR(20),
    full_art BOOLEAN DEFAULT FALSE,
    textless BOOLEAN DEFAULT FALSE,
    oversized BOOLEAN DEFAULT FALSE,
    promo BOOLEAN DEFAULT FALSE,
    variation BOOLEAN DEFAULT FALSE,
    booster BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);

-- image_uris テーブル（画像URI）
CREATE TABLE image_uris (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    printing_id INTEGER,
    card_face_id INTEGER,
    image_type VARCHAR(20) NOT NULL,  -- small, normal, large, png, art_crop, border_crop
    uri VARCHAR(512) NOT NULL,
    is_card_face BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (printing_id) REFERENCES printings(id) ON DELETE CASCADE,
    FOREIGN KEY (card_face_id) REFERENCES card_faces(id) ON DELETE CASCADE,
    CHECK (printing_id IS NOT NULL OR card_face_id IS NOT NULL)
);

-- related_cards テーブル（関連するカード）
CREATE TABLE related_cards (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    related_card_id VARCHAR(36) NOT NULL,
    component VARCHAR(50),  -- token, combo_piece など
    name VARCHAR(255),
    type_line VARCHAR(255),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- prices テーブル（価格情報）
CREATE TABLE prices (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    printing_id INTEGER NOT NULL,
    usd DECIMAL(10, 2),
    usd_foil DECIMAL(10, 2),
    usd_etched DECIMAL(10, 2),
    eur DECIMAL(10, 2),
    eur_foil DECIMAL(10, 2),
    tix DECIMAL(10, 2),
    updated_at DATETIME,
    FOREIGN KEY (printing_id) REFERENCES printings(id) ON DELETE CASCADE
);

-- legalities テーブル（各フォーマットでの適正）
CREATE TABLE legalities (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    format VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,  -- legal, not_legal, restricted, banned
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    UNIQUE (card_id, format)
);

-- purchase_uris テーブル（購入URI）
CREATE TABLE purchase_uris (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    source VARCHAR(50) NOT NULL,  -- tcgplayer, cardmarket, cardhoarder
    uri VARCHAR(512) NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- related_uris テーブル（関連URI）
CREATE TABLE related_uris (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    card_id VARCHAR(36) NOT NULL,
    source VARCHAR(50) NOT NULL,  -- gatherer, edhrec など
    uri VARCHAR(512) NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_oracle_id ON cards(oracle_id);
CREATE INDEX idx_cards_layout ON cards(layout);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_cmc ON cards(cmc);
CREATE INDEX idx_cards_colors ON cards(colors);

CREATE INDEX idx_card_faces_card_id ON card_faces(card_id);
CREATE INDEX idx_card_faces_name ON card_faces(name);

CREATE INDEX idx_printings_card_id ON printings(card_id);
CREATE INDEX idx_printings_set_id ON printings(set_id);
CREATE INDEX idx_printings_lang ON printings(lang);

CREATE INDEX idx_legalities_format ON legalities(format);
CREATE INDEX idx_legalities_status ON legalities(status);

CREATE INDEX idx_sets_code ON sets(code);
CREATE INDEX idx_sets_name ON sets(name);

CREATE INDEX idx_image_uris_printing_id ON image_uris(printing_id);
CREATE INDEX idx_image_uris_card_face_id ON image_uris(card_face_id);