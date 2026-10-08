<?php
return [
    // Mozilla public trust roots, obtained from curl.se and checked against its SHA256.
    'ca_bundle' => env('HTTP_CA_BUNDLE', resource_path('certificates/cacert.pem')),
];
