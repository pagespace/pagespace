var gulp = require('gulp'),
    run = require('gulp-run'),
    jshint = require('gulp-jshint'),
    jasmine = require('gulp-jasmine'),
    concat = require('gulp-concat');

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

gulp.task('test', [ 'clean' ], function () {
    gulp.src('***/*//*-spec.js')
        .pipe(jasmine());

});

gulp.task('build-client', [ 'lint-client' ], function() {
    gulp.src('./admin/dashboard/app/**/*.js')
        .pipe(concat('admin-app.js'))
        .pipe(gulp.dest('./admin/dashboard/build'));
});

gulp.task('watch', [ 'build-client' ], function() {
    gulp.watch('./admin/dashboard/app/**/*.js', ['buildAdmin']);
});

gulp.task('default', [ 'build-client', 'test', 'lint-server'], function() {

});