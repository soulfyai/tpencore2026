<?php
declare(strict_types=1);
// Aggregate page views only: no cookies, sessions, IP addresses or visitor identifiers.
header_remove('Set-Cookie');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['ok' => false]);
    exit;
}
if ($method === 'POST') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $originHost = $origin === '' ? '' : strtolower((string)parse_url($origin, PHP_URL_HOST));
    $host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
    if (($origin !== '' && $originHost !== $host) || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        http_response_code(403);
        echo json_encode(['ok' => false]);
        exit;
    }
}
try {
    if (!extension_loaded('pdo_sqlite')) {
        throw new RuntimeException('Counter storage unavailable');
    }
    // Web root /volume1/web/tpencore -> private data /volume1/tpencore-data.
    // Override with TPENCORE_COUNTER_DB if the NAS uses another directory layout.
    $volumeRoot = preg_match('~^/volume[0-9]+(?=/|$)~', __DIR__, $matches) ? $matches[0] : dirname(__DIR__, 2);
    $path = getenv('TPENCORE_COUNTER_DB') ?: $volumeRoot . '/tpencore-data/visits.sqlite';
    if (!is_dir(dirname($path)) || !is_writable(dirname($path))) {
        throw new RuntimeException('Counter storage unavailable');
    }
    $db = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000');
    // The same transaction initializes metadata and increments both counters.
    // An existing lifetime total never becomes a fabricated daily count.
    $db->exec('BEGIN IMMEDIATE');
    $db->exec('CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0 CHECK(value >= 0))');
    $db->exec("INSERT OR IGNORE INTO totals(name,value) VALUES ('views',0)");
    $db->exec('CREATE TABLE IF NOT EXISTS daily_views (day TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0 CHECK(views >= 0))');
    $db->exec('CREATE TABLE IF NOT EXISTS counter_metadata (name TEXT PRIMARY KEY, value TEXT NOT NULL)');
    $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei'));
    $day = $now->format('Y-m-d');
    $metadata = $db->prepare('INSERT OR IGNORE INTO counter_metadata(name,value) VALUES (?,?)');
    $metadata->execute(['daily_tracking_started_at', $now->format(DateTimeInterface::ATOM)]);
    $startedAt = (string)$db->query("SELECT value FROM counter_metadata WHERE name='daily_tracking_started_at'")->fetchColumn();
    $startedDay = (new DateTimeImmutable($startedAt))->setTimezone(new DateTimeZone('Asia/Taipei'))->format('Y-m-d');
    if ($method === 'POST') {
        $db->exec("UPDATE totals SET value=value+1 WHERE name='views'");
        // INSERT OR IGNORE + UPDATE also works with older Synology SQLite builds.
        $daily = $db->prepare('INSERT OR IGNORE INTO daily_views(day,views) VALUES (?,0)');
        $daily->execute([$day]);
        $daily = $db->prepare('UPDATE daily_views SET views=views+1 WHERE day=?');
        $daily->execute([$day]);
    }
    $views = (int)$db->query("SELECT value FROM totals WHERE name='views'")->fetchColumn();
    $daily = $db->prepare('SELECT views FROM daily_views WHERE day=?');
    $daily->execute([$day]);
    $today = (int)($daily->fetchColumn() ?: 0);
    $prune = $db->prepare('DELETE FROM daily_views WHERE day < ?');
    $prune->execute([$now->modify('-89 days')->format('Y-m-d')]);
    $db->exec('COMMIT');
    echo json_encode(['ok' => true, 'views' => $views, 'today' => $today,
        'date' => $day, 'timezone' => 'Asia/Taipei',
        'daily_tracking_started_at' => $startedAt, 'today_is_partial' => $day === $startedDay]);

} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'counter_unavailable']);
}
