echo Cleaning database
mongo test --eval "db.dropDatabase()"
mongorestore --db test spec/e2e/fixtures/db/test
echo Cleaning upload directory
rm media-uploads/* -f
echo Creating test user
mongo test --eval 'db.addUser({ user: "tester", pwd: "test", roles: [ "readWrite" ] })'
