var gulp = require('gulp'),
    run = require('gulp-run'),
    jshint = require('gulp-jshint'),
    jasmine = require('gulp-jasmine'),
    concat = require('gulp-concat');

var httpSupport = require('./spec/e2e/support/http-support');

gulp.task('lint-client', function() {
    return gulp.src(['admin/dashboard/app/**/*.js', 'admin/inpage/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('lint-server', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('clean', function() {
    return run('./clean.sh').exec()
        .pipe(gulp.dest('output'))
});

gulp.task('jasmine', [ 'clean' ], function () {

    return gulp.src('**/*-spec.js')
        .pipe(jasmine());

});
gulp.task('test', [ 'jasmine' ], function (done) {
    httpSupport.end().then(done);
});

gulp.task('build-client', [ 'lint-client' ], function() {
    return gulp.src('./admin/dashboard/app/**/*.js')
        .pipe(concat('admin-app.js'))
        .pipe(gulp.dest('./admin/dashboard/build'));
});

gulp.task('watch', [ 'build-client' ], function() {
    gulp.watch('./admin/dashboard/app/**/*.js', ['buildAdmin']);
});

gulp.task('default', [ 'build-client', 'test', 'lint-server'], function() {
    //can't always get tests to exit!
    setTimeout(function() {
        process.exit(0);
    }, 1000);

});