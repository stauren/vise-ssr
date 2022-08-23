rm -rf ../vise-on-heroku/bundles/*
cp -r ./packages/express-server/bundles/* ../vise-on-heroku/bundles/
find ../vise-on-heroku/bundles/ -name "*.js.map" -type f -delete
