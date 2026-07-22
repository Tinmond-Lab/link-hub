<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=1800');

const CHANNEL_HANDLE = 'TimondLab';
const CACHE_TTL = 3600;

$cacheFile = sys_get_temp_dir() . '/timondlab_latest_video.json';

function fetch_url(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; TimondLabBot/1.0)',
        ]);
        $body = curl_exec($ch);
        $ok = $body !== false && curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200;
        curl_close($ch);
        return $ok ? $body : null;
    }

    $context = stream_context_create([
        'http' => [
            'timeout' => 8,
            'header' => "User-Agent: Mozilla/5.0 (compatible; TimondLabBot/1.0)\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    return $body !== false ? $body : null;
}

function resolve_channel_id(string $handle): ?string
{
    $html = fetch_url("https://www.youtube.com/@{$handle}");
    if ($html === null) {
        return null;
    }
    if (preg_match('/"channelId":"(UC[a-zA-Z0-9_-]{22})"/', $html, $matches)) {
        return $matches[1];
    }
    return null;
}

function fetch_latest_video(string $channelId): ?array
{
    $xml = fetch_url("https://www.youtube.com/feeds/videos.xml?channel_id={$channelId}");
    if ($xml === null) {
        return null;
    }

    $prevErrorSetting = libxml_use_internal_errors(true);
    $feed = simplexml_load_string($xml);
    libxml_use_internal_errors($prevErrorSetting);

    if ($feed === false || !isset($feed->entry[0])) {
        return null;
    }

    $entry = $feed->entry[0];
    $yt = $entry->children('http://www.youtube.com/xml/schemas/2015');
    $videoId = (string) $yt->videoId;
    if ($videoId === '') {
        return null;
    }

    return [
        'videoId' => $videoId,
        'title' => (string) $entry->title,
        'videoUrl' => "https://www.youtube.com/watch?v={$videoId}",
        'thumbnailUrl' => "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg",
    ];
}

if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < CACHE_TTL) {
    echo file_get_contents($cacheFile);
    exit;
}

$channelId = resolve_channel_id(CHANNEL_HANDLE);
$video = $channelId !== null ? fetch_latest_video($channelId) : null;

if ($video !== null) {
    $payload = json_encode($video + ['updatedAt' => time()]);
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
