tsc
browserify inspector/network.js > inspector/network.out.js -r preact
rm inspector/network.js
mv inspector/network.out.js inspector/network.js