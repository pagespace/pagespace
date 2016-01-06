echo Cleaning database
mongo test --eval "db.dropDatabase()"
mongorestore --db test spec/e2e/fixtures/db/test
echo Cleaning upload directory
rm media-uploads/* -f
echo Creating test user
#will fail on mongo 3, travis is still on mongo 2.6
mongo test --eval 'db.addUser({ user: "tester", pwd: "test", roles: [ "readWrite" ] })' || true
