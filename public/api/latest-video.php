<?php

// PHP because the site currently deploys to shared PHP hosting — CORS rules out
// calling YouTube straight from client JS, so the fetch has to happen server-side.
// Moving host? See "Latest video thumbnail" in README.md for how to port this.
//
// Troubleshooting a 502 or "unavailable" response: hit this file with
// ?debug=1 (e.g. https://yourdomain.com/api/latest-video.php?debug=1). It
// skips the cache and reports exactly which step failed and why (outbound
// connections blocked by the host, curl missing, timeout, etc.) instead of
// just failing silently.

declare(strict_types=1);

set_time_limit(20);

const CHANNEL_HANDLE = 'TimondLab';
const CACHE_TTL = 3600;
const REQUEST_TIMEOUT = 6;
const CONNECT_TIMEOUT = 4;

$cacheFile = sys_get_temp_dir() . '/timondlab_latest_video.json';
$debug = isset($_GET['debug']);

/**
 * @return array{body: ?string, error: ?string, httpCode: ?int}
 */
function fetch_url(string $url): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => REQUEST_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; TimondLabBot/1.0)',
        ]);
        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            return ['body' => null, 'error' => "curl: {$curlError}", 'httpCode' => null];
        }
        if ($httpCode !== 200) {
            return ['body' => null, 'error' => "unexpected HTTP status {$httpCode}", 'httpCode' => $httpCode];
        }
        return ['body' => $body, 'error' => null, 'httpCode' => $httpCode];
    }

    if (!ini_get('allow_url_fopen')) {
        return ['body' => null, 'error' => 'curl extension missing and allow_url_fopen is disabled', 'httpCode' => null];
    }

    $context = stream_context_create([
        'http' => [
            'timeout' => REQUEST_TIMEOUT,
            'header' => "User-Agent: Mozilla/5.0 (compatible; TimondLabBot/1.0)\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        $lastError = error_get_last();
        return ['body' => null, 'error' => 'file_get_contents: ' . ($lastError['message'] ?? 'unknown error'), 'httpCode' => null];
    }
    return ['body' => $body, 'error' => null, 'httpCode' => 200];
}

/**
 * @return array{channelId: ?string, error: ?string}
 */
function resolve_channel_id(string $handle): array
{
    $result = fetch_url("https://www.youtube.com/@{$handle}");
    if ($result['body'] === null) {
        return ['channelId' => null, 'error' => $result['error']];
    }
    if (preg_match('/"channelId":"(UC[a-zA-Z0-9_-]{22})"/', $result['body'], $matches)) {
        return ['channelId' => $matches[1], 'error' => null];
    }
    return ['channelId' => null, 'error' => 'channelId pattern not found in channel page HTML'];
}

/**
 * @return array{video: ?array, error: ?string}
 */
function fetch_latest_video(string $channelId): array
{
    $result = fetch_url("https://www.youtube.com/feeds/videos.xml?channel_id={$channelId}");
    if ($result['body'] === null) {
        return ['video' => null, 'error' => $result['error']];
    }

    $prevErrorSetting = libxml_use_internal_errors(true);
    $feed = simplexml_load_string($result['body']);
    libxml_use_internal_errors($prevErrorSetting);

    if ($feed === false || !isset($feed->entry[0])) {
        return ['video' => null, 'error' => 'RSS feed did not parse or had no entries'];
    }

    $entry = $feed->entry[0];
    $yt = $entry->children('http://www.youtube.com/xml/schemas/2015');
    $videoId = (string) $yt->videoId;
    if ($videoId === '') {
        return ['video' => null, 'error' => 'first RSS entry had no yt:videoId'];
    }

    return [
        'video' => [
            'videoId' => $videoId,
            'title' => (string) $entry->title,
            'videoUrl' => "https://www.youtube.com/watch?v={$videoId}",
            'thumbnailUrl' => "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
        ],
        'error' => null,
    ];
}

if ($debug) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');

    $channelResult = resolve_channel_id(CHANNEL_HANDLE);
    $videoResult = $channelResult['channelId'] !== null
        ? fetch_latest_video($channelResult['channelId'])
        : ['video' => null, 'error' => 'skipped: no channel id'];

    echo json_encode([
        'phpVersion' => PHP_VERSION,
        'curlAvailable' => function_exists('curl_init'),
        'allowUrlFopen' => (bool) ini_get('allow_url_fopen'),
        'cacheFile' => $cacheFile,
        'cacheFileWritable' => is_writable(dirname($cacheFile)),
        'step1_resolveChannelId' => $channelResult,
        'step2_fetchLatestVideo' => $videoResult,
    ], JSON_PRETTY_PRINT);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=1800');

if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_TTL) {
    echo file_get_contents($cacheFile);
    exit;
}

$channelResult = resolve_channel_id(CHANNEL_HANDLE);
$videoResult = $channelResult['channelId'] !== null
    ? fetch_latest_video($channelResult['channelId'])
    : ['video' => null, 'error' => null];

if ($videoResult['video'] !== null) {
    $payload = json_encode($videoResult['video'] + ['updatedAt' => time()]);
    @file_put_contents($cacheFile, $payload);
    echo $payload;
    exit;
}

if (is_file($cacheFile)) {
    echo file_get_contents($cacheFile);
    exit;
}

http_response_code(502);
echo json_encode(['error' => 'unavailable']);
