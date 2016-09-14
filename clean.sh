echo Cleaning database
mongo pagespace_test --eval "db.dropDatabase()"
mongorestore --db pagespace_test spec/e2e/fixtures/db/test
echo Cleaning upload directory
rm media-uploads/* -f
echo Creating test user
#will fail on mongo 3, travis is still on mongo 2.6
mongo pagespace_test --eval 'db.addUser({ user: "tester", pwd: "test", roles: [ "readWrite" ] })' || \
      mongo pagespace_test --eval 'db.createUser({ user: "tester", pwd: "test", roles: [{ role: "readWrite", db: "pagespace_test" }]})' || \
      true

