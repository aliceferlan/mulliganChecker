<?php
/**
 * Magic: The Gatheringのタイプデータをデータベースに挿入するスクリプト
 * Scryfall API対応版
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
    'log_file' => $dbConfig['log_file'] ?? __DIR__ . '/logs/import_types.log',
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

// 取得するタイプデータのURL一覧
$urls = [
    'artists' => 'https://api.scryfall.com/catalog/artist-names',
    'super_types' => 'https://api.scryfall.com/catalog/supertypes',
    'card_types' => 'https://api.scryfall.com/catalog/card-types',
    'artifact_types' => 'https://api.scryfall.com/catalog/artifact-types',
    'battle_types' => 'https://api.scryfall.com/catalog/battle-types',
    'creature_types' => 'https://api.scryfall.com/catalog/creature-types',
    'enchant_types' => 'https://api.scryfall.com/catalog/enchantment-types',
    'land_types' => 'https://api.scryfall.com/catalog/land-types',
    'planeswalker_types' => 'https://api.scryfall.com/catalog/planeswalker-types',
    'spell_types' => 'https://api.scryfall.com/catalog/spell-types',
    'keyword_abilities' => 'https://api.scryfall.com/catalog/keyword-abilities',
];

/**
 * ScryfallからAPIデータを取得する
 */
function fetchApiData($url, $retryCount = 3, $sleepTime = 0.1)
    {
    log_message("URLからデータを取得: $url");

    // ユーザーエージェントとコンテキストを設定
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Mozilla/5.0 MTG Type Importer',
                'Accept: application/json'
            ],
            'timeout' => 30
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);

    // リトライ処理
    $attempts = 0;
    $error = null;

    while ($attempts < $retryCount) {
        try {
            $response = file_get_contents($url, false, $context);
            if ($response === false) {
                throw new Exception("データの取得に失敗しました");
                }

            $data = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSONのパースに失敗しました: " . json_last_error_msg());
                }

            log_message("正常にデータを取得しました: " . count($data['data']) . " 件");
            return $data;
            } catch (Exception $e) {
            $error = $e;
            $attempts++;
            log_message("試行 $attempts 回目でエラー: " . $e->getMessage());

            if ($attempts < $retryCount) {
                $waitTime = $sleepTime * pow(2, $attempts - 1); // エクスポネンシャルバックオフ
                log_message("$waitTime 秒後に再試行します...");
                sleep($waitTime);
                }
            }
        }

    // 全てのリトライが失敗した場合
    throw new Exception("最大リトライ回数に達しました。最後のエラー: " . $error->getMessage());
    }

/**
 * データベース接続を取得
 */
function getDatabaseConnection($config)
    {
    try {
        log_message("データベースに接続しています...");

        $pdo = new PDO(
            "mysql:host={$config['db']['host']};dbname={$config['db']['name']};charset={$config['db']['charset']}",
            $config['db']['user'],
            $config['db']['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );

        log_message("データベースに接続しました");
        return $pdo;
        } catch (PDOException $e) {
        log_message("データベース接続エラー: " . $e->getMessage());
        exit(1);
        }
    }

/**
 * タイプデータをテーブルに挿入
 */
function insertTypes($pdo, $tableName, $types)
    {
    try {
        log_message("$tableName テーブルにデータを挿入しています...");

        // トランザクション開始
        $pdo->beginTransaction();

        // 一旦テーブルをクリア
        $pdo->exec("TRUNCATE TABLE $tableName");

        // データ挿入用のSQL
        $sql = "INSERT INTO $tableName (id, name) VALUES (:id, :name)";
        $stmt = $pdo->prepare($sql);

        $count = 0;
        foreach ($types as $index => $type) {
            // IDをスラッグ化（小文字化して空白をアンダースコアに）
            $id = strtolower(str_replace([' ', '-', "'", ','], '_', $type));

            $stmt->bindValue(':id', $id);
            $stmt->bindValue(':name', $type);
            $stmt->execute();

            $count++;
            }

        // トランザクションをコミット
        $pdo->commit();

        log_message("$count 件のデータを $tableName テーブルに挿入しました");
        return $count;
        } catch (PDOException $e) {
        // エラー時はロールバック
        $pdo->rollBack();
        log_message("データベース挿入エラー ($tableName): " . $e->getMessage());
        return 0;
        }
    }

/**
 * メイン処理
 */
function run()
    {
    global $config, $urls;

    log_message("MTGタイプデータインポートを開始します");

    try {
        // データベース接続
        $pdo = getDatabaseConnection($config);

        // 各タイプのデータを取得して挿入
        $stats = [
            'success' => 0,
            'failed' => 0,
            'counts' => []
        ];

        // API URLとテーブルのマッピング
        $tableMapping = [
            'artists' => 'artist_names',
            'super_types' => 'supertypes',
            'card_types' => 'card_types',
            'artifact_types' => 'artifact_types',
            'battle_types' => 'battle_types',
            'creature_types' => 'creature_types',
            'enchant_types' => 'enchantment_types',
            'land_types' => 'land_types',
            'planeswalker_types' => 'planeswalker_types',
            'spell_types' => 'spell_types',
            'keyword_abilities' => 'keywords'
        ];

        foreach ($urls as $typeKey => $url) {
            $tableName = $tableMapping[$typeKey] ?? $typeKey;

            try {
                log_message("$typeKey の取得を開始します");

                // APIからデータを取得
                $data = fetchApiData($url);

                // データを挿入
                if (isset($data['data']) && is_array($data['data'])) {
                    $count = insertTypes($pdo, $tableName, $data['data']);
                    $stats['counts'][$typeKey] = $count;
                    $stats['success']++;
                    } else {
                    log_message("警告: $typeKey のデータ形式が不正です");
                    $stats['failed']++;
                    }

                // APIリクエスト間のスリープ（レート制限回避）
                sleep(0.1);
                } catch (Exception $e) {
                log_message("エラー: $typeKey の処理に失敗しました - " . $e->getMessage());
                $stats['failed']++;
                }
            }

        // 結果を出力
        log_message("\n=== インポート結果 ===");
        log_message("成功: {$stats['success']} タイプ");
        log_message("失敗: {$stats['failed']} タイプ");

        log_message("\n=== 詳細 ===");
        foreach ($stats['counts'] as $type => $count) {
            log_message("$type: $count 件");
            }

        } catch (Exception $e) {
        log_message("致命的なエラー: " . $e->getMessage());
        log_message($e->getTraceAsString());
        }

    log_message("処理を完了しました");
    }

// 実行
run();

