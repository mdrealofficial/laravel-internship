<?php
    $companyName = \Illuminate\Support\Facades\DB::table('site_settings')
        ->where('setting_key', 'company_name')
        ->value('setting_value') ?? 'DIGI5 LTD';
    
    $faviconUrl = \Illuminate\Support\Facades\DB::table('site_settings')
        ->where('setting_key', 'favicon_url')
        ->value('setting_value') ?? '/favicon.svg';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $companyName }} - Certificate Verification</title>
    <meta name="description" content="{{ $companyName }} Internship Management and Certificate Verification Platform" />
    <meta name="author" content="{{ $companyName }}" />
    <link rel="icon" type="image/svg+xml" href="{{ $faviconUrl }}" />

    <meta property="og:title" content="{{ $companyName }} - Certificate Verification" />
    <meta property="og:description" content="{{ $companyName }} Internship Management and Certificate Verification Platform" />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/js/main.tsx'])
</head>
<body class="antialiased">
    <div id="root"></div>
</body>
</html>
