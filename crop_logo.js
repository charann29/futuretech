const fs = require('fs');
const https = require('https');

// We'll use a simple node script that trims the image since sharp might not be installed.
// Or we can just use the command line tools if they exist like sips on mac.
