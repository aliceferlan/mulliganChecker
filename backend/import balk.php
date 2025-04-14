<?php
/**
 * Magic: The Gatheringカードデータをデータベースに挿入するクラス
 * Scryfall JSONファイル対応版
 */


// 設定ファイルを読み込む
$configFile = __DIR__ . '/../../config/database.php';
if (!file_exists($configFile)) {
    die("設定ファイルが見つかりません: $configFile");
    }

$dbConfig = require $configFile;

// 共通設定を構築
$config = [
    'memory_limit' => $dbConfig['memory_limit'] ?? '8G',
    'data_dir' => $dbConfig['data_dir'] ?? __DIR__ . '/data',
    'log_file' => $dbConfig['log_file'] ?? __DIR__ . '/logs/import.log',
    'db' => $dbConfig['db']
];

set_time_limit(0);

// メモリ制限を設定
ini_set('memory_limit', $config['memory_limit']);

// ディレクトリの確認と作成
if (!file_exists($config['data_dir'])) {
    mkdir($config['data_dir'], 0755, true);
    }
if (!file_exists(dirname($config['log_file']))) {
    mkdir(dirname($config['log_file']), 0755, true);
    }

/**
 * ログを記録する関数
 */
function log_message($message)
    {
    global $config;
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message\n";
    file_put_contents($config['log_file'], $log_message, FILE_APPEND);
    echo $log_message;
    }

/**
 * Scryfallから最新のカードデータをダウンロード
 */
function downloadLatestScryfallData($destinationPath)
    {
    log_message("カードデータのダウンロードを開始します...");

    // ユーザーエージェントとコンテキストを設定
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Mozilla/5.0 MTG Card Importer',
                'Accept: application/json'
            ],
            'timeout' => 300
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);

    // 直接指定したURLからダウンロード
    $url = 'https://data.scryfall.io/all-cards/all-cards-20250410094705.json';
    log_message("ダウンロード元URL: $url");

    try {
        // ファイルサイズが大きいのでストリーミングでダウンロード
        $tmpFile = $destinationPath . '.tmp';

        log_message("ダウンロード中...");
        $remote = fopen($url, 'r', false, $context);
        $local = fopen($tmpFile, 'w');

        if (!$remote || !$local) {
            throw new Exception("ファイルのオープンに失敗しました");
            }

        $totalBytes = 0;
        $startTime = time();
        $lastLogTime = $startTime;

        // 4KBずつ読み込み
        while (!feof($remote)) {
            $buffer = fread($remote, 4096);
            fwrite($local, $buffer);
            $totalBytes += strlen($buffer);

            // 10秒ごとに進捗を報告
            $currentTime = time();
            if ($currentTime - $lastLogTime >= 10) {
                $elapsed = $currentTime - $startTime;
                $mbDownloaded = round($totalBytes / (1024 * 1024), 2);
                $speed = ($elapsed > 0) ? round($mbDownloaded / $elapsed, 2) : 0;
                log_message("進捗: {$mbDownloaded}MB ダウンロード済み ({$speed}MB/秒)");
                $lastLogTime = $currentTime;
                }
            }

        fclose($remote);
        fclose($local);

        // ダウンロード完了したら本ファイルに移動
        if (filesize($tmpFile) > 0) {
            rename($tmpFile, $destinationPath);
            $fileSizeMb = round(filesize($destinationPath) / (1024 * 1024), 2);
            log_message("ダウンロード完了: {$fileSizeMb}MB");
            return $destinationPath;
            } else {
            throw new Exception("ダウンロードされたファイルが空です");
            }

        } catch (Exception $e) {
        log_message("エラー: " . $e->getMessage());

        // 既存ファイルがあればそれを使用
        if (file_exists($destinationPath)) {
            log_message("既存ファイルを使用します: " . $destinationPath);
            return $destinationPath;
            }
        throw $e;
        }
    }

class MTGCardInserter
    {
    private $pdo;
    private $batchSize = 100; // 一度にコミットする件数
    private $processedCards = 0;

    /**
     * コンストラクタ
     */
    public function __construct(PDO $pdo)
        {
        $this->pdo = $pdo;
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        }

    /**
     * JSONファイルからカードをインポート
     */
    public function importFromFile($file)
        {
        if (!file_exists($file)) {
            throw new Exception("ファイルが存在しません: $file");
            }

        log_message("ファイル $file からのインポートを開始します");

        $stats = [
            'inserted_cards' => 0,
            'inserted_card_faces' => 0,
            'inserted_printings' => 0,
            'inserted_sets' => 0,
            'inserted_legalities' => 0,
            'inserted_images' => 0,
            'inserted_prices' => 0,
            'errors' => []
        ];

        $fp = fopen($file, 'r');
        if (!$fp) {
            throw new Exception("ファイルを開けませんでした: $file");
            }

        // JSONデータの最初の文字 '[' をスキップ
        $firstChar = fgetc($fp);
        if ($firstChar !== '[') {
            throw new Exception("JSONが配列形式ではありません");
            }

        $this->pdo->beginTransaction();
        $batchCount = 0;

        // 改善されたストリーミングパーサー
        $json = '';
        $inString = false;
        $escape = false;
        $bracketLevel = 0;

        while (!feof($fp)) {
            $char = fgetc($fp);
            if ($char === false)
                break;

            // エスケープ文字の処理
            if ($escape) {
                $json .= $char;
                $escape = false;
                continue;
                }

            // 文字列内なら特殊処理
            if ($inString) {
                $json .= $char;
                if ($char === '\\') {
                    $escape = true;
                    } elseif ($char === '"') {
                    $inString = false;
                    }
                continue;
                }

            // 文字列外の処理
            switch ($char) {
                case '"':
                    $inString = true;
                    $json .= $char;
                    break;

                case '{':
                    $bracketLevel++;
                    $json .= $char;
                    break;

                case '}':
                    $bracketLevel--;
                    $json .= $char;

                    // カード1件分のJSONが完成した場合
                    if ($bracketLevel === 0) {
                        // カードを処理
                        $cardData = json_decode($json, true);
                        if ($cardData) {
                            try {
                                $this->processCard($cardData, $stats);
                                $batchCount++;
                                $this->processedCards++;

                                // batchSizeごとにコミットして新しいトランザクションを開始
                                if ($batchCount >= $this->batchSize) {
                                    $this->pdo->commit();
                                    $this->pdo->beginTransaction();
                                    $batchCount = 0;

                                    // メモリ解放とログ
                                    gc_collect_cycles();
                                    log_message("処理済み: {$this->processedCards}件 (カード: {$stats['inserted_cards']}, 面: {$stats['inserted_card_faces']}, セット: {$stats['inserted_sets']})");
                                    }
                                } catch (Exception $e) {
                                $cardId = $cardData['id'] ?? '不明';
                                $stats['errors'][] = "カードID $cardId の処理中にエラー: " . $e->getMessage();
                                log_message("エラー: カードID $cardId - " . $e->getMessage());
                                }
                            } else {
                            $stats['errors'][] = "JSONパースエラー: " . json_last_error_msg();
                            }

                        // 次のカードの準備
                        $json = '';

                        // 次の文字を確認
                        $nextChar = fgetc($fp);

                        // 配列の終わりか確認
                        if ($nextChar === ']' || $nextChar === false) {
                            // 終了
                            break 2;
                            } else if ($nextChar !== ',') {
                            // 異常なフォーマット
                            throw new Exception("予期しないJSON形式です。カンマまたは配列終了が必要");
                            }
                        }
                    break;

                default:
                    $json .= $char;
                    break;
                }
            }

        fclose($fp);

        // 残りのトランザクションをコミット
        if ($this->pdo->inTransaction()) {
            $this->pdo->commit();
            }

        log_message("インポート完了: {$this->processedCards}件のカードを処理しました");
        return $stats;
        }

    /**
     * カード1件を処理
     */
    private function processCard($card, &$stats)
        {
        // セットを挿入
        $this->insertSet($card);
        $stats['inserted_sets']++;

        // カード本体を挿入
        $this->insertCard($card);
        $stats['inserted_cards']++;

        // カード面を挿入（両面カード、分割カードなど）
        if (isset($card['card_faces']) && is_array($card['card_faces'])) {
            $this->insertCardFaces($card);
            $stats['inserted_card_faces'] += count($card['card_faces']);
            }

        // 印刷情報を挿入
        $printingId = $this->insertPrinting($card);
        $stats['inserted_printings']++;

        // 画像URIを挿入
        if (isset($card['image_uris']) && is_array($card['image_uris'])) {
            $this->insertImages($card, $printingId);
            $stats['inserted_images'] += count($card['image_uris']);
            }

        // 適正情報を挿入
        if (isset($card['legalities']) && is_array($card['legalities'])) {
            $this->insertLegalities($card);
            $stats['inserted_legalities'] += count($card['legalities']);
            }

        // 価格情報を挿入
        if (isset($card['prices']) && is_array($card['prices']) && $printingId) {
            $this->insertPrices($card, $printingId);
            $stats['inserted_prices']++;
            }
        }

    /**
     * カード基本情報を挿入
     */
    private function insertCard($card)
        {
        // 色と色アイデンティティをカンマ区切りの文字列に変換
        $colors = isset($card['colors']) ? implode(',', $card['colors']) : null;
        $colorIdentity = isset($card['color_identity']) ? implode(',', $card['color_identity']) : null;
        $keywords = isset($card['keywords']) ? implode(',', $card['keywords']) : null;
        $producedMana = isset($card['produced_mana']) ? implode(',', $card['produced_mana']) : null;

        $sql = "INSERT INTO cards (
                id, oracle_id, name, mana_cost, cmc, type_line, oracle_text, colors,
                color_identity, keywords, power, toughness, loyalty, produced_mana,
                rarity, layout, reserved, foil, nonfoil, game_changer,
                digital, released_at, edhrec_rank, penny_rank, artist, artist_id,
                scryfall_uri
            ) VALUES (
                :id, :oracle_id, :name, :mana_cost, :cmc, :type_line, :oracle_text, :colors,
                :color_identity, :keywords, :power, :toughness, :loyalty, :produced_mana,
                :rarity, :layout, :reserved, :foil, :nonfoil, :game_changer,
                :digital, :released_at, :edhrec_rank, :penny_rank, :artist, :artist_id,
                :scryfall_uri
            )
            ON DUPLICATE KEY UPDATE
                oracle_id = VALUES(oracle_id),
                name = VALUES(name),
                mana_cost = VALUES(mana_cost),
                cmc = VALUES(cmc),
                type_line = VALUES(type_line),
                oracle_text = VALUES(oracle_text),
                colors = VALUES(colors),
                color_identity = VALUES(color_identity),
                keywords = VALUES(keywords),
                power = VALUES(power),
                toughness = VALUES(toughness),
                loyalty = VALUES(loyalty),
                produced_mana = VALUES(produced_mana),
                rarity = VALUES(rarity),
                layout = VALUES(layout),
                reserved = VALUES(reserved),
                foil = VALUES(foil),
                nonfoil = VALUES(nonfoil),
                game_changer = VALUES(game_changer),
                digital = VALUES(digital),
                released_at = VALUES(released_at),
                edhrec_rank = VALUES(edhrec_rank),
                penny_rank = VALUES(penny_rank),
                artist = VALUES(artist),
                artist_id = VALUES(artist_id),
                scryfall_uri = VALUES(scryfall_uri)";

        $stmt = $this->pdo->prepare($sql);

        $params = [
            ':id' => $card['id'] ?? null,
            ':oracle_id' => $card['oracle_id'] ?? null,
            ':name' => $card['name'] ?? null,
            ':mana_cost' => $card['mana_cost'] ?? null,
            ':cmc' => $card['cmc'] ?? null,
            ':type_line' => $card['type_line'] ?? null,
            ':oracle_text' => $card['oracle_text'] ?? null,
            ':colors' => $colors,
            ':color_identity' => $colorIdentity,
            ':keywords' => $keywords,
            ':power' => $card['power'] ?? null,
            ':toughness' => $card['toughness'] ?? null,
            ':loyalty' => $card['loyalty'] ?? null,
            ':produced_mana' => $producedMana,
            ':rarity' => $card['rarity'] ?? null,
            ':layout' => $card['layout'] ?? null,
            ':reserved' => isset($card['reserved']) ? ($card['reserved'] ? 1 : 0) : 0,
            ':foil' => isset($card['foil']) ? ($card['foil'] ? 1 : 0) : 0,
            ':nonfoil' => isset($card['nonfoil']) ? ($card['nonfoil'] ? 1 : 0) : 0,
            ':game_changer' => isset($card['game_changer']) ? ($card['game_changer'] ? 1 : 0) : 0,
            ':digital' => isset($card['digital']) ? ($card['digital'] ? 1 : 0) : 0,
            ':released_at' => $card['released_at'] ?? null,
            ':edhrec_rank' => $card['edhrec_rank'] ?? null,
            ':penny_rank' => $card['penny_rank'] ?? null,
            ':artist' => $card['artist'] ?? null,
            ':artist_id' => $card['artist_id'] ?? ($card['artist_ids'][0] ?? null),
            ':scryfall_uri' => $card['scryfall_uri'] ?? null
        ];

        $stmt->execute($params);
        }

    /**
     * カードの面を挿入
     */
    private function insertCardFaces($card)
        {
        $sql = "INSERT INTO card_faces (
                card_id, face_index, name, mana_cost, type_line, oracle_text, colors,
                power, toughness, loyalty, flavor_text, artist, artist_id, illustration_id
            ) VALUES (
                :card_id, :face_index, :name, :mana_cost, :type_line, :oracle_text, :colors,
                :power, :toughness, :loyalty, :flavor_text, :artist, :artist_id, :illustration_id
            )
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                mana_cost = VALUES(mana_cost),
                type_line = VALUES(type_line),
                oracle_text = VALUES(oracle_text),
                colors = VALUES(colors),
                power = VALUES(power),
                toughness = VALUES(toughness),
                loyalty = VALUES(loyalty),
                flavor_text = VALUES(flavor_text),
                artist = VALUES(artist),
                artist_id = VALUES(artist_id),
                illustration_id = VALUES(illustration_id)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($card['card_faces'] as $index => $face) {
            // 色をカンマ区切りの文字列に変換
            $colors = isset($face['colors']) ? implode(',', $face['colors']) : null;

            $params = [
                ':card_id' => $card['id'],
                ':face_index' => $index,
                ':name' => $face['name'] ?? null,
                ':mana_cost' => $face['mana_cost'] ?? null,
                ':type_line' => $face['type_line'] ?? null,
                ':oracle_text' => $face['oracle_text'] ?? null,
                ':colors' => $colors,
                ':power' => $face['power'] ?? null,
                ':toughness' => $face['toughness'] ?? null,
                ':loyalty' => $face['loyalty'] ?? null,
                ':flavor_text' => $face['flavor_text'] ?? null,
                ':artist' => $face['artist'] ?? null,
                ':artist_id' => $face['artist_id'] ?? null,
                ':illustration_id' => $face['illustration_id'] ?? null
            ];

            $stmt->execute($params);

            // 最後に挿入されたID取得
            $faceId = $this->pdo->lastInsertId();

            // カード面の画像URIを挿入
            if (isset($face['image_uris']) && is_array($face['image_uris'])) {
                $this->insertCardFaceImages($faceId, $face['image_uris']);
                }
            }
        }

    /**
     * セット情報を挿入
     */
    private function insertSet($card)
        {
        if (!isset($card['set_id']) || !isset($card['set'])) {
            return;
            }

        $sql = "INSERT IGNORE INTO sets (
                id, code, name, set_type, released_at, card_count, digital, scryfall_uri
            ) VALUES (
                :id, :code, :name, :set_type, :released_at, :card_count, :digital, :scryfall_uri
            )";

        $stmt = $this->pdo->prepare($sql);

        $params = [
            ':id' => $card['set_id'],
            ':code' => $card['set'],
            ':name' => $card['set_name'] ?? null,
            ':set_type' => $card['set_type'] ?? null,
            ':released_at' => $card['released_at'] ?? null,
            ':card_count' => null, // カード数はJSONに含まれていない場合が多い
            ':digital' => isset($card['digital']) ? ($card['digital'] ? 1 : 0) : 0,
            ':scryfall_uri' => $card['scryfall_set_uri'] ?? null
        ];

        $stmt->execute($params);
        }

    /**
     * 印刷情報を挿入
     */
    private function insertPrinting($card)
        {
        // multiverse_idsを文字列に変換
        $multiverseIds = isset($card['multiverse_ids']) ? implode(',', $card['multiverse_ids']) : null;

        $sql = "INSERT INTO printings (
                card_id, set_id, collector_number, printed_name, printed_type_line, printed_text,
                lang, multiverse_ids, mtgo_id, arena_id, tcgplayer_id, cardmarket_id, border_color,
                frame, security_stamp, full_art, textless, oversized, promo, variation, booster
            ) VALUES (
                :card_id, :set_id, :collector_number, :printed_name, :printed_type_line, :printed_text,
                :lang, :multiverse_ids, :mtgo_id, :arena_id, :tcgplayer_id, :cardmarket_id, :border_color,
                :frame, :security_stamp, :full_art, :textless, :oversized, :promo, :variation, :booster
            )
            ON DUPLICATE KEY UPDATE
                set_id = VALUES(set_id),
                collector_number = VALUES(collector_number),
                printed_name = VALUES(printed_name),
                printed_type_line = VALUES(printed_type_line),
                printed_text = VALUES(printed_text),
                lang = VALUES(lang),
                multiverse_ids = VALUES(multiverse_ids),
                mtgo_id = VALUES(mtgo_id),
                arena_id = VALUES(arena_id),
                tcgplayer_id = VALUES(tcgplayer_id),
                cardmarket_id = VALUES(cardmarket_id),
                border_color = VALUES(border_color),
                frame = VALUES(frame),
                security_stamp = VALUES(security_stamp),
                full_art = VALUES(full_art),
                textless = VALUES(textless),
                oversized = VALUES(oversized),
                promo = VALUES(promo),
                variation = VALUES(variation),
                booster = VALUES(booster)";

        $stmt = $this->pdo->prepare($sql);

        $params = [
            ':card_id' => $card['id'],
            ':set_id' => $card['set_id'] ?? null,
            ':collector_number' => $card['collector_number'] ?? null,
            ':printed_name' => $card['printed_name'] ?? null,
            ':printed_type_line' => $card['printed_type_line'] ?? null,
            ':printed_text' => $card['printed_text'] ?? null,
            ':lang' => $card['lang'] ?? null,
            ':multiverse_ids' => $multiverseIds,
            ':mtgo_id' => $card['mtgo_id'] ?? null,
            ':arena_id' => $card['arena_id'] ?? null,
            ':tcgplayer_id' => $card['tcgplayer_id'] ?? null,
            ':cardmarket_id' => $card['cardmarket_id'] ?? null,
            ':border_color' => $card['border_color'] ?? null,
            ':frame' => $card['frame'] ?? null,
            ':security_stamp' => $card['security_stamp'] ?? null,
            ':full_art' => isset($card['full_art']) ? ($card['full_art'] ? 1 : 0) : 0,
            ':textless' => isset($card['textless']) ? ($card['textless'] ? 1 : 0) : 0,
            ':oversized' => isset($card['oversized']) ? ($card['oversized'] ? 1 : 0) : 0,
            ':promo' => isset($card['promo']) ? ($card['promo'] ? 1 : 0) : 0,
            ':variation' => isset($card['variation']) ? ($card['variation'] ? 1 : 0) : 0,
            ':booster' => isset($card['booster']) ? ($card['booster'] ? 1 : 0) : 0
        ];

        $stmt->execute($params);

        // 最後に挿入されたID取得
        return $this->pdo->lastInsertId();
        }

    /**
     * 画像URIを挿入
     */
    private function insertImages($card, $printingId)
        {
        if (!$printingId)
            return 0;

        $sql = "INSERT INTO image_uris (
                printing_id, image_type, uri, is_card_face
            ) VALUES (
                :printing_id, :image_type, :uri, :is_card_face
            )
            ON DUPLICATE KEY UPDATE
                uri = VALUES(uri)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($card['image_uris'] as $type => $uri) {
            $params = [
                ':printing_id' => $printingId,
                ':image_type' => $type,
                ':uri' => $uri,
                ':is_card_face' => 0
            ];

            $stmt->execute($params);
            }

        return count($card['image_uris']);
        }

    /**
     * カード面の画像URIを挿入
     */
    private function insertCardFaceImages($cardFaceId, $imageUris)
        {
        $sql = "INSERT INTO image_uris (
                card_face_id, image_type, uri, is_card_face
            ) VALUES (
                :card_face_id, :image_type, :uri, :is_card_face
            )
            ON DUPLICATE KEY UPDATE
                uri = VALUES(uri)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($imageUris as $type => $uri) {
            $params = [
                ':card_face_id' => $cardFaceId,
                ':image_type' => $type,
                ':uri' => $uri,
                ':is_card_face' => 1
            ];

            $stmt->execute($params);
            }
        }

    /**
     * 適正情報を挿入
     */
    private function insertLegalities($card)
        {
        $sql = "INSERT INTO legalities (
                card_id, format, status
            ) VALUES (
                :card_id, :format, :status
            )
            ON DUPLICATE KEY UPDATE
                status = VALUES(status)";

        $stmt = $this->pdo->prepare($sql);

        foreach ($card['legalities'] as $format => $status) {
            $params = [
                ':card_id' => $card['id'],
                ':format' => $format,
                ':status' => $status
            ];

            $stmt->execute($params);
            }
        }

    /**
     * 価格情報を挿入
     */
    private function insertPrices($card, $printingId)
        {
        $sql = "INSERT INTO prices (
                printing_id, usd, usd_foil, usd_etched, eur, eur_foil, tix, updated_at
            ) VALUES (
                :printing_id, :usd, :usd_foil, :usd_etched, :eur, :eur_foil, :tix, NOW()
            )
            ON DUPLICATE KEY UPDATE
                usd = VALUES(usd),
                usd_foil = VALUES(usd_foil),
                usd_etched = VALUES(usd_etched),
                eur = VALUES(eur),
                eur_foil = VALUES(eur_foil),
                tix = VALUES(tix),
                updated_at = NOW()";

        $stmt = $this->pdo->prepare($sql);

        $params = [
            ':printing_id' => $printingId,
            ':usd' => $card['prices']['usd'] ?? null,
            ':usd_foil' => $card['prices']['usd_foil'] ?? null,
            ':usd_etched' => $card['prices']['usd_etched'] ?? null,
            ':eur' => $card['prices']['eur'] ?? null,
            ':eur_foil' => $card['prices']['eur_foil'] ?? null,
            ':tix' => $card['prices']['tix'] ?? null
        ];

        $stmt->execute($params);
        }
    }

/**
 * メイン処理
 */
function run()
    {
    global $config;

    log_message("MTGカードインポータを開始します");

    try {
        // データベース接続
        $pdo = new PDO(
            "mysql:host={$config['db']['host']};dbname={$config['db']['name']};charset={$config['db']['charset']}",
            $config['db']['user'],
            $config['db']['pass'],

        );

        // カードデータをダウンロード
        $cardFile = downloadLatestScryfallData($config['data_dir'] . '/latest-cards.json');

        // インポーター作成
        $inserter = new MTGCardInserter($pdo);

        // インポート実行
        $stats = $inserter->importFromFile($cardFile);

        // 結果を出力
        log_message("処理完了:");
        log_message("挿入したカード数: {$stats['inserted_cards']}");
        log_message("挿入したカード面数: {$stats['inserted_card_faces']}");
        log_message("挿入したセット数: {$stats['inserted_sets']}");
        log_message("挿入した印刷情報数: {$stats['inserted_printings']}");
        log_message("挿入した適正情報数: {$stats['inserted_legalities']}");
        log_message("挿入した画像数: {$stats['inserted_images']}");
        log_message("挿入した価格情報数: {$stats['inserted_prices']}");

        // エラーがあれば表示
        if (count($stats['errors']) > 0) {
            log_message("\nエラーリスト:");
            foreach ($stats['errors'] as $i => $error) {
                if ($i >= 10) {
                    log_message("... その他 " . (count($stats['errors']) - 10) . " 件のエラーがあります");
                    break;
                    }
                log_message("- {$error}");
                }
            }

        } catch (Exception $e) {
        log_message("致命的なエラー: " . $e->getMessage());
        log_message($e->getTraceAsString());
        }
    }

// 実行
run();
