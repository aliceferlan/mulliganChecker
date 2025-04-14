<?php
// データベース設定ファイル
return [
    'db' => [
        'host' => 'hostname',
        'name' => 'dbnamae',
        'user' => 'username',
        'pass' => 'password',
        'charset' => 'utf8mb4'
    ],
    'data_dir' => __DIR__ . '/data',
    'log_file' => __DIR__ . '/logs/update.log',
    'last_update_file' => __DIR__ . '/data/last_update.json',
    'bulk_data_type' => 'all_cards', // all_cards, default_cards, oracle_cards, unique_artwork
    'memory_limit' => '4G', // 大きなJSONファイルを処理するためにメモリ制限を引き上げ
];