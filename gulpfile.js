var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    jasmine = require('gulp-jasmine'),
    concat = require('gulp-concat');

//not currently automated. See https://github.com/spalger/gulp-jshint/issues/77
gulp.task('lint-client', function() {
    return gulp.src(['admin/dashboard/app/**/*.js', 'admin/inpage/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
});

gulp.task('lint-server', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
});

gulp.task('test', [ 'lint' ], function () {
    gulp.src('**/*-spec.js')
        .pipe(jasmine());
});

gulp.task('buildAdmin', function() {
    gulp.src('./admin/dashboard/app/**/*.js')
        .pipe(concat('admin-app.js'))
        .pipe(gulp.dest('./admin/dashboard/build'));
});

gulp.task('watch', [ 'buildAdmin' ], function() {
    gulp.watch('./admin/dashboard/app/**/*.js', ['buildAdmin']);
});

gulp.task('default', [ 'buildAdmin', 'lint-server'], function() {

});