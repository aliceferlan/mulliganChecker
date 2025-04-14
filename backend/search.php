<?php
// filepath: search_cards.php


// CORSヘッダーを設定
header('Access-Control-Allow-Origin: *');  // すべてのオリジンからのアクセスを許可
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONSリクエスト（プリフライトリクエスト）の場合は早期に終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
    }

// 通常のレスポンスヘッダー
header('Content-Type: application/json');

// 以下、既存のコード

// 検索条件のJSONを取得
$requestBody = file_get_contents('php://input');
$searchCriteria = json_decode($requestBody, true);

// var_dump($requestBody);
// var_dump($searchCriteria); // デバッグ用

// if (json_last_error() !== JSON_ERROR_NONE) {
//     http_response_code(400);
//     echo json_encode(['error' => '不正なJSON形式です: ' . json_last_error_msg()]);
//     exit;
//     }

// // GETリクエストの場合は使用方法を表示
// if ($_SERVER['REQUEST_METHOD'] === 'GET') {
//     echo json_encode(getApiUsage(), JSON_PRETTY_PRINT);
//     exit;
//     }

// データベース設定の読み込み
$configFile = __DIR__ . '/../../config/database.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => '設定ファイルが見つかりません']);
    exit;
    }

$dbConfig = require $configFile;

try {
    // データベースに接続
    $pdo = new PDO(
        "mysql:host={$dbConfig['db']['host']};dbname={$dbConfig['db']['name']};charset={$dbConfig['db']['charset']}",
        $dbConfig['db']['user'],
        $dbConfig['db']['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$dbConfig['db']['charset']}"
        ]
    );

    // var_dump($searchCriteria);
    // カード検索の実行
    $searchResults = searchCards($pdo, $searchCriteria);

    // 結果を返す
    echo json_encode([
        'total' => count($searchResults),
        'cards' => $searchResults
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    } catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
    }

/**
 * 検索条件からSQLクエリを生成する関数
 * 
 * @param array $criteria 検索条件
 * @return string
 */
function createQuery(array $criteria): array
    {
    // テーブル定義
    $cardTable = 'cards c';
    $faceTable = 'card_faces f';
    $printTable = 'printings p';
    $formatTable = 'legalities l';

    // 演算子マッピング
    $operands = [
        'max' => '<=',
        'min' => '>=',
        'equal' => '=',
    ];
    // カラムマッピング
    $where_conditions = [
        'name' => 'c.name',                  // cardsテーブルから名前を取得
        'type' => 'c.type_line',             // card_facesではなくcardsからtype_lineを取得
        'set' => 's.code',                   // printingsではなくsetsテーブルからコードを取得
        'text' => 'c.oracle_text',           // card_facesではなくcardsからoracle_textを取得
        'colors' => 'c.colors',              // 正しい
        'power' => 'c.power',                // card_facesではなくcardsからpowerを取得
        'toughness' => 'c.toughness',        // card_facesではなくcardsからtoughnessを取得
        'loyalty' => 'c.loyalty',            // card_facesではなくcardsからloyaltyを取得
        'face' => 'f.face_index',            // 正しい
        'cmc' => 'c.cmc',                    // card_facesではなくcardsからcmcを取得
        'rarity' => 'c.rarity',              // 正しい
        'language' => 'p.lang',              // 正しい
        'format' => 'l.format',              // 正しい
        'keywords' => 'c.keywords',          // 正しい
        'artist' => 'c.artist',              // printingsではなくcardsからartistを取得
        'layout' => 'c.layout',              // レイアウト情報の追加
        'collector_number' => 'p.collector_number', // コレクター番号の追加
        'set_name' => 's.name',              // セット名の追加
    ];

    $query_snippets = [];
    $params = []; // バインドパラメータを格納する配列

    // ページネーション用のパラメータを抽出
    $limit = isset($criteria['limit']) ? (int) $criteria['limit'] : 20;
    $offset = isset($criteria['offset']) ? (int) $criteria['offset'] : 0;

    // limit/offsetをcriteriaから削除して検索条件に含まれないようにする
    unset($criteria['limit'], $criteria['offset']);

    foreach ($criteria as $key => $value) {
        // 検索条件のキーに基づいて適切なテーブルとカラムを選択
        $column = $where_conditions[$key] ?? null;
        if (!$column)
            continue;

        // 色検索の特別処理
        if ($key === 'colors' && is_array($value) && !empty($value)) {
            $colorCondition = handleColorSearch($value[0], $column);
            if ($colorCondition) {
                $query_snippets[] = $colorCondition;
                }
            continue;
            }

        // フォーマット検索の特別処理
        if ($key === 'format' && is_array($value) && !empty($value)) {
            $formatCondition = handleFormatSearch($value, $column);
            if ($formatCondition) {
                $query_snippets[] = $formatCondition;
                }
            continue;
            }

        // テキスト検索の特別処理
        if ($key === 'text' && is_array($value) && !empty($value)) {
            $textCondition = handleTextSearch($value, $column);
            if ($textCondition) {
                $query_snippets[] = $textCondition['condition'];
                $params = array_merge($params, $textCondition['params']);
                }
            continue;
            }

        // 通常の検索条件処理
        if (is_array($value)) {
            // 配列値の場合（IN検索）
            if (isset($value[0]) && !is_array($value[0])) {
                $placeholders = [];
                foreach ($value as $i => $v) {
                    $paramName = "{$key}_{$i}";
                    $placeholders[] = ":$paramName";
                    $params[$paramName] = $v;
                    }
                if (!empty($placeholders)) {
                    $query_snippets[] = "$column IN (" . implode(", ", $placeholders) . ")";
                    }
                }
            // 範囲検索の場合（min/max/equal）
            else if (array_intersect_key($value, array_flip(['min', 'max', 'equal']))) {
                $rangeConditions = [];
                foreach ($value as $op => $v) {
                    if (isset($operands[$op])) {
                        $paramName = "{$key}_{$op}";
                        $rangeConditions[] = "$column {$operands[$op]} :$paramName";
                        $params[$paramName] = $v;
                        }
                    }

                if (!empty($rangeConditions)) {
                    $query_snippets[] = '(' . implode(" AND ", $rangeConditions) . ')';
                    }
                }
            } else {
            // 単純な等価検索
            $paramName = $key;
            $query_snippets[] = "$column = :$paramName";
            $params[$paramName] = $value;
            }
        }

    // FROM句の構築
    $from = "FROM cards c INNER JOIN printings p ON c.id = p.card_id LEFT JOIN sets s ON p.set_id = s.id LEFT JOIN card_faces f ON c.id = f.card_id LEFT JOIN legalities l ON c.id = l.card_id";

    // 最終的なWHERE句を構築
    $whereClause = !empty($query_snippets) ? 'WHERE ' . implode(" AND ", $query_snippets) : '';

    // LIMIT句を構築
    $limitClause = "LIMIT $limit OFFSET $offset";

    $sql = "SELECT * $from $whereClause $limitClause";

    return [$sql, $params];
    }

/**
 * 色検索条件を処理する関数
 * 
 * @param array $colorCriteria 色検索条件
 * @param string $column 色情報が格納されているカラム
 * @return string|null SQL条件文
 */
function handleColorSearch(array $colorCriteria, string $column): ?string
    {
    // 色検索の種類を判断
    $operand = $colorCriteria['operand'] ?? 'all';
    $colors = $colorCriteria['values'] ?? [];

    if (empty($colors)) {
        return null;
        }

    // MTGの全色リスト
    $allColors = ['W', 'U', 'B', 'R', 'G'];

    // 色検索モードに応じた条件を生成
    switch ($operand) {
        case 'all': // 色の内全てを含む（他の色も許容）
            $conditions = [];

            // 選択した色を含む条件
            foreach ($colors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) > 0";
                }

            return '(' . implode(" AND ", $conditions) . ')';

        case 'exact': // 色の内全てを含み、それ以外を含まない
            $conditions = [];

            // 選択した色を含む条件
            foreach ($colors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) > 0";
                }

            // 選択していない色を含まない条件
            $otherColors = array_diff($allColors, $colors);
            foreach ($otherColors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) = 0";
                }

            return '(' . implode(" AND ", $conditions) . ')';

        case 'any': // 色の内1つ以上を含む
            $conditions = [];

            // 選択した色のいずれかを含む条件
            foreach ($colors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) > 0";
                }

            return '(' . implode(" OR ", $conditions) . ')';

        case 'none': // 選択した色を含まない
            $conditions = [];

            // 選択した色を含まない条件
            foreach ($colors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) = 0";
                }

            return '(' . implode(" AND ", $conditions) . ')';

        case 'colorless': // 無色カードの検索
            $conditions = [];

            // すべての色を含まない条件
            foreach ($allColors as $color) {
                $conditions[] = "FIND_IN_SET('$color', $column) = 0";
                }

            return '(' . implode(" AND ", $conditions) . ')';

        default:
            return null;
        }
    }

/**
 * フォーマット検索条件を処理する関数
 * 
 * @param array $formatCriteria フォーマット検索条件
 * @param string $column フォーマット情報が格納されているカラム
 * @return string|null SQL条件文
 */
function handleFormatSearch(array $formatCriteria, string $column): ?string
    {
    if (empty($formatCriteria)) {
        return null;
        }

    $conditions = [];

    foreach ($formatCriteria as $format) {
        if (isset($format['value']) && isset($format['status'])) {
            $formatValue = $format['value'];
            $statusValue = $format['status'];
            $conditions[] = "($column = '$formatValue' AND l.status = '$statusValue')";
            }
        }

    if (empty($conditions)) {
        return null;
        }

    return '(' . implode(" OR ", $conditions) . ')';
    }

/**
 * テキスト検索条件を処理する関数
 * 
 * @param array $textCriteria テキスト検索条件
 * @param string $column テキスト情報が格納されているカラム
 * @return array|null SQL条件文とパラメータ
 */
function handleTextSearch(array $textCriteria, string $column): ?array
    {
    $params = [];
    $conditions = [];

    foreach ($textCriteria as $i => $criteria) {
        if (isset($criteria['text'])) {
            $operand = strtoupper($criteria['operand'] ?? 'AND');
            $text = $criteria['text'];
            $paramName = "text_{$i}";
            $conditions[] = "$column LIKE :$paramName";
            $params[$paramName] = "%$text%";
            }
        }

    if (empty($conditions)) {
        return null;
        }

    return [
        'condition' => '(' . implode(" $operand ", $conditions) . ')',
        'params' => $params
    ];
    }


/**
 * 検索条件に基づいてカードを検索
 * 
 * @param PDO $pdo PDO接続インスタンス
 * @param array $criteria 検索条件
 * @return array 検索結果
 */
function searchCards($pdo, $criteria)
    {
    $queries = createQuery($criteria);

    $sql = $queries[0]; // SQLクエリ
    $params = $queries[1]; // バインドパラメータ

    // var_dump($sql); // デバッグ用

    // ステートメントを準備
    $stmt = $pdo->prepare($sql);

    // var_dump($params);
    // パラメータをバインド
    foreach ($params as $key => $value) {
        $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        // var_dump("-------------------");
        // var_dump($key, $value, $paramType); // デバッグ用

        $stmt->bindValue($key, $value, $paramType);
        }

    // var_dump($sql); // デバッグ用

    // 実行
    $stmt->execute();

    // 結果処理
    $results = [];
    $cardIndexMap = []; // カードIDをインデックスにマップ

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cardId = $row['id'];

        var_dump($row);

        // 既に同じカードが結果にある場合は追加情報だけ追加
        // if (isset($cardIndexMap[$cardId])) {
        //     $index = $cardIndexMap[$cardId];
        //     if ($includeImages && isset($row['uri']) && isset($row['image_type'])) {
        //         $results[$index]['images'][$row['image_type']] = $row['uri'];
        //         }
        //     continue;
        //     }

        // 新しいカードを結果に追加
        $card = [
            'id' => $row['id'],
            'name' => $row['name'],
            'mana_cost' => $row['mana_cost'],
            'cmc' => $row['cmc'],
            'type_line' => $row['type_line'],
            'oracle_text' => $row['oracle_text'],
            'colors' => $row['colors'] ? explode(',', $row['colors']) : [],
            'color_identity' => $row['color_identity'] ? explode(',', $row['color_identity']) : [],
            'power' => $row['power'],
            'toughness' => $row['toughness'],
            'loyalty' => $row['loyalty'],
            'rarity' => $row['rarity'],
            'layout' => $row['layout'],
        ];

        // 言語情報があれば追加
        if (isset($row['lang']) && $row['lang']) {
            $card['lang'] = $row['lang'];
            }

        // キーワードがある場合は追加
        if (isset($row['keywords']) && $row['keywords']) {
            $card['keywords'] = explode(',', $row['keywords']);
            }

        // // 画像がある場合は追加
        // if ($includeImages && isset($row['uri']) && isset($row['image_type'])) {
        //     $card['images'] = [
        //         $row['image_type'] => $row['uri']
        //     ];
        //     }

        // // セット情報がある場合は追加
        // if ($includeSets && isset($row['set_code'])) {
        //     $card['set'] = $row['set_code'];
        //     $card['set_name'] = $row['set_name'];
        //     }

        $results[] = $card;
        $cardIndexMap[$cardId] = count($results) - 1;
        }

    // カードが見つかった場合、追加情報を取得
    if (!empty($results) && isset($criteria['include_details']) && $criteria['include_details']) {
        enrichCardDetails($pdo, $results);
        }

    return $results;
    }

/**
 * 検索結果のカード情報を追加データで充実させる
 * 
 * @param PDO $pdo PDO接続インスタンス
 * @param array &$cards 検索結果のカード配列（参照渡し）
 */
function enrichCardDetails($pdo, &$cards)
    {
    // カードIDのリスト
    $cardIds = array_column($cards, 'id');
    $placeholders = implode(',', array_fill(0, count($cardIds), '?'));

    // インデックス作成
    $cardIndex = [];
    foreach ($cards as $index => $card) {
        $cardIndex[$card['id']] = $index;
        }

    // 適正情報を取得
    if (!empty($cardIds)) {
        $legalitySql = "SELECT card_id, format, status FROM legalities WHERE card_id IN ($placeholders)";
        $legalityStmt = $pdo->prepare($legalitySql);
        $legalityStmt->execute($cardIds);

        while ($row = $legalityStmt->fetch()) {
            $cardId = $row['card_id'];
            if (isset($cardIndex[$cardId])) {
                $index = $cardIndex[$cardId];
                if (!isset($cards[$index]['legalities'])) {
                    $cards[$index]['legalities'] = [];
                    }
                $cards[$index]['legalities'][$row['format']] = $row['status'];
                }
            }
        }

    // 価格情報を取得
    if (!empty($cardIds)) {
        $priceSql = "SELECT p.card_id, pr.usd, pr.usd_foil, pr.eur, pr.tix
                     FROM printings p 
                     JOIN prices pr ON p.id = pr.printing_id 
                     WHERE p.card_id IN ($placeholders) 
                     ORDER BY pr.updated_at DESC";
        $priceStmt = $pdo->prepare($priceSql);
        $priceStmt->execute($cardIds);

        $processedCardIds = [];

        while ($row = $priceStmt->fetch()) {
            $cardId = $row['card_id'];
            // 各カードの最新の価格情報のみを使用
            if (!in_array($cardId, $processedCardIds) && isset($cardIndex[$cardId])) {
                $index = $cardIndex[$cardId];
                $cards[$index]['prices'] = [
                    'usd' => $row['usd'],
                    'usd_foil' => $row['usd_foil'],
                    'eur' => $row['eur'],
                    'tix' => $row['tix']
                ];
                $processedCardIds[] = $cardId;
                }
            }
        }

    // セット情報を取得（まだ含まれていない場合）
    $cardIdsWithoutSet = [];
    foreach ($cards as $index => $card) {
        if (!isset($card['set'])) {
            $cardIdsWithoutSet[] = $card['id'];
            }
        }

    if (!empty($cardIdsWithoutSet)) {
        $placeholders = implode(',', array_fill(0, count($cardIdsWithoutSet), '?'));
        $setSql = "SELECT p.card_id, s.code, s.name 
                  FROM printings p 
                  JOIN sets s ON p.set_id = s.id 
                  WHERE p.card_id IN ($placeholders)";
        $setStmt = $pdo->prepare($setSql);
        $setStmt->execute($cardIdsWithoutSet);

        while ($row = $setStmt->fetch()) {
            $cardId = $row['card_id'];
            if (isset($cardIndex[$cardId])) {
                $index = $cardIndex[$cardId];
                $cards[$index]['set'] = $row['code'];
                $cards[$index]['set_name'] = $row['name'];
                }
            }
        }
    }

/**
 * API使用方法を返す（デバッグ用）
 */
function getApiUsage()
    {
    return [
        'description' => 'MTGカード検索API',
        'usage' => [
            'method' => 'POST',
            'content-type' => 'application/json',
            'example_body' => [
                'name' => 'Dragon',
                'text' => 'draw a card',
                'colors' => ['R', 'G'],
                'cmc' => ['min' => 3, 'max' => 5],
                'type' => 'Creature',
                'rarity' => ['rare', 'mythic'],
                'include_images' => true,
                'include_sets' => true,
                'limit' => 20,
                'offset' => 0
            ]
        ]
    ];
    }

