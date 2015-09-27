mongo spec --eval "db.dropDatabase()"
mongorestore --db spec spec/e2e/fixtures/db
rm media-uploads/*
jasmine