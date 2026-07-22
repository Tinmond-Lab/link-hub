<?php

// PHP because the site currently deploys to shared PHP hosting — CORS rules out
// calling YouTube straight from client JS, so the fetch has to happen server-side.
// Moving host? See "Latest video thumbnail" in README.md for how to port this.
//
// Troubleshooting a 502 or "unavailable" response: hit this file with
// ?debug=1&token=<DEBUG_TOKEN below> (e.g.
// https://yourdomain.com/api/latest-video.php?debug=1&token=...). It skips
// the cache and reports exactly which step failed and why (outbound
// connections blocked by the host, curl missing, timeout, etc.) instead of
// just failing silently. The token is required so this can't be used by
// random visitors to force unlimited live requests or read server details.
// Set it via the LATEST_VIDEO_DEBUG_TOKEN environment variable if your host
// supports one; otherwise change DEBUG_TOKEN_FALLBACK below to your own
// random string before relying on debug mode.

declare(strict_types=1);

set_time_limit(20);

const CHANNEL_HANDLE = 'TimondLab';
const CACHE_TTL = 3600;
const REQUEST_TIMEOUT = 6;
const CONNECT_TIMEOUT = 4;
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Change this (or set the LATEST_VIDEO_DEBUG_TOKEN env var) to your own
// random string. Debug mode is unreachable — not "open with a weak
// password" — until you do, since the fallback below won't match any
// token an outside visitor could guess.
const DEBUG_TOKEN_FALLBACK = '06ccc65c09278b895360e233c28bc709-change-me';

$debugToken = getenv('LATEST_VIDEO_DEBUG_TOKEN');
if ($debugToken === false || $debugToken === '') {
    $debugToken = DEBUG_TOKEN_FALLBACK;
}
$providedToken = is_string($_GET['token'] ?? null) ? $_GET['token'] : '';
$debug = isset($_GET['debug']) && hash_equals($debugToken, $providedToken);

/**
 * Cache lives outside the web root when possible (two levels above this
 * script, which is normally the account home directory on shared hosting)
 * so it can't be read or overwritten by other requests / other tenants on
 * a shared temp directory. Falls back to the system temp dir, namespaced
 * with a value only this source file knows, if that's not writable.
 */
function resolve_cache_file(): string
{
    $preferredDir = dirname(__DIR__, 2) . '/.timondlab-cache';
    if ((is_dir($preferredDir) || @mkdir($preferredDir, 0700, true)) && is_writable($preferredDir)) {
        return $preferredDir . '/latest-video.json';
    }

    $namespace = substr(hash('sha256', __FILE__ . DEBUG_TOKEN_FALLBACK), 0, 16);
    return sys_get_temp_dir() . "/timondlab-latest-video-{$namespace}.json";
}

$cacheFile = resolve_cache_file();

/**
 * Writes via a temp file + rename so a request reading the cache mid-write
 * never sees a truncated/partial file (rename is atomic on the same
 * filesystem).
 */
function write_cache(string $cacheFile, string $payload): void
{
    $tmpFile = $cacheFile . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmpFile, $payload) !== false) {
        @rename($tmpFile, $cacheFile);
    } else {
        @unlink($tmpFile);
    }
}

/**
 * @return array{body: ?string, error: ?string, httpCode: ?int}
 */
function fetch_url(string $url): array
{
    // A plain bot UA gets YouTube's EU cookie-consent interstitial instead of
    // the real page, which has none of the channel data we're looking for.
    // A real browser UA + a pre-accepted consent cookie avoids that.
    $headers = [
        'Accept-Language: en-US,en;q=0.9',
        'Cookie: CONSENT=YES+1',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => REQUEST_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => CONNECT_TIMEOUT,
            CURLOPT_USERAGENT => BROWSER_USER_AGENT,
            CURLOPT_HTTPHEADER => $headers,
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
            'header' => 'User-Agent: ' . BROWSER_USER_AGENT . "\r\n" . implode("\r\n", $headers) . "\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        $lastError = error_get_last();
        return ['body' => null, 'error' => 'file_get_contents: ' . ($lastError['message'] ?? 'unknown error'), 'httpCode' => null];
    }
    return ['body' => $body, 'error' => null, 'httpCode' => 200];
}

// Ordered most- to least-trustworthy. canonical/og:url identify the page's
// own entity; "channelId"/"externalId" can also appear in embedded sidebar
// widgets for unrelated suggested channels, so they're a last resort.
const CHANNEL_ID_PATTERNS = [
    '#<link rel="canonical" href="https://www\.youtube\.com/channel/(UC[a-zA-Z0-9_-]{22})"#',
    '#<meta property="og:url" content="https://www\.youtube\.com/channel/(UC[a-zA-Z0-9_-]{22})"#',
    '/"channelId":"(UC[a-zA-Z0-9_-]{22})"/',
    '/"externalId":"(UC[a-zA-Z0-9_-]{22})"/',
];

/**
 * @return array{channelId: ?string, error: ?string, debug?: array}
 */
function resolve_channel_id(string $handle, bool $debug = false): array
{
    $result = fetch_url("https://www.youtube.com/@{$handle}");
    if ($result['body'] === null) {
        return ['channelId' => null, 'error' => $result['error']];
    }

    foreach (CHANNEL_ID_PATTERNS as $pattern) {
        if (preg_match($pattern, $result['body'], $matches)) {
            return ['channelId' => $matches[1], 'error' => null];
        }
    }

    $error = ['channelId' => null, 'error' => 'no channelId pattern matched the channel page HTML'];
    if ($debug) {
        $error['debug'] = [
            'bodyLength' => strlen($result['body']),
            'bodySnippet' => substr($result['body'], 0, 800),
            'looksLikeConsentPage' => str_contains($result['body'], 'consent.youtube.com')
                || str_contains(strtolower($result['body']), 'before you continue'),
        ];
    }
    return $error;
}

// YouTube video IDs are always exactly 11 URL-safe-base64 characters. Cached
// or feed data should never contain anything else, but this is served to
// every site visitor and interpolated into URLs on both ends, so it's worth
// confirming the shape rather than trusting it blindly.
const VIDEO_ID_PATTERN = '/^[A-Za-z0-9_-]{11}$/';

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
    if (!preg_match(VIDEO_ID_PATTERN, $videoId)) {
        return ['video' => null, 'error' => 'yt:videoId missing or not in the expected format'];
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

    $channelResult = resolve_channel_id(CHANNEL_HANDLE, true);
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

if (isset($_GET['debug'])) {
    // ?debug was requested but the token didn't match — fail closed with a
    // generic 404 rather than a 403 that confirms this endpoint even has a
    // debug mode.
    http_response_code(404);
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
    if ($payload !== false) {
        write_cache($cacheFile, $payload);
        echo $payload;
        exit;
    }
}

if (is_file($cacheFile)) {
    echo file_get_contents($cacheFile);
    exit;
}

http_response_code(502);
echo json_encode(['error' => 'unavailable']);
